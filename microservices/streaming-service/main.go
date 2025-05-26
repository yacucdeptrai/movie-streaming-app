package main

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cloudfront/sign"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// Cấu hình CloudFront
var (
	distributionDomain = os.Getenv("DISTRIBUTION_DOMAIN")
	privateKeyPath     = os.Getenv("PRIVATE_KEY_PATH")
	keyPairId          = os.Getenv("KEY_PAIR_ID")
	bucketName         = "movie-streaming-dest"
)

// Kiểm tra biến môi trường
func init() {
	if distributionDomain == "" {
		log.Fatal("DISTRIBUTION_DOMAIN environment variable is not set")
	}
	if privateKeyPath == "" {
		log.Fatal("PRIVATE_KEY_PATH environment variable is not set")
	}
	if keyPairId == "" {
		log.Fatal("KEY_PAIR_ID environment variable is not set")
	}

	if _, err := os.Stat(privateKeyPath); os.IsNotExist(err) {
		log.Fatalf("Private key file does not exist at path: %s", privateKeyPath)
	}
}

// Đọc và parse private key từ file
func loadPrivateKey(path string) (*rsa.PrivateKey, error) {
	privateKeyBytes, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read private key file: %v", err)
	}

	block, _ := pem.Decode(privateKeyBytes)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block containing private key")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %v", err)
		}
		if rsaKey, ok := key.(*rsa.PrivateKey); ok {
			return rsaKey, nil
		}
		return nil, fmt.Errorf("parsed key is not an RSA private key")
	}

	return privateKey, nil
}

// Kiểm tra file tồn tại trên S3
func checkFileExists(key string) (bool, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	if err != nil {
		return false, fmt.Errorf("failed to create AWS session: %v", err)
	}

	svc := s3.New(sess)
	_, err = svc.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return false, fmt.Errorf("file does not exist: %v", err)
	}
	return true, nil
}

// Tạo presigned URL từ CloudFront
func getCloudFrontPresignedURL(key string) (string, error) {
	exists, err := checkFileExists(key)
	if err != nil || !exists {
		return "", fmt.Errorf("file %s does not exist on S3: %v", key, err)
	}

	privateKey, err := loadPrivateKey(privateKeyPath)
	if err != nil {
		return "", fmt.Errorf("failed to load private key: %v", err)
	}

	url := fmt.Sprintf("https://%s/%s", distributionDomain, key)
	signer := sign.NewURLSigner(keyPairId, privateKey)
	signedURL, err := signer.Sign(url, time.Now().Add(3600*time.Second))
	if err != nil {
		return "", fmt.Errorf("failed to sign URL: %v", err)
	}

	return signedURL, nil
}

// Handler cho API /api/stream/{movie_id}
func streamHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	movieID := vars["movie_id"]
	folder := fmt.Sprintf("%s/hls/", movieID)

	// Liệt kê file .m3u8 trong thư mục
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to create AWS session: %v", err), http.StatusInternalServerError)
		return
	}

	svc := s3.New(sess)
	resp, err := svc.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
		Prefix: aws.String(folder),
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to list objects: %v", err), http.StatusInternalServerError)
		return
	}

	// Tìm tất cả file .m3u8 và tạo danh sách độ phân giải
	type resolutionInfo struct {
		Quality string `json:"quality"`
		URL     string `json:"url"`
	}
	var resolutions []resolutionInfo
	qualities := map[string]string{
		"_1080p.m3u8": "1080p",
		"_720p.m3u8":  "720p",
		"_480p.m3u8":  "480p",
	}

	for _, obj := range resp.Contents {
		if strings.HasSuffix(*obj.Key, ".m3u8") {
			for suffix, quality := range qualities {
				if strings.HasSuffix(*obj.Key, suffix) {
					signedURL, err := getCloudFrontPresignedURL(*obj.Key)
					if err != nil {
						log.Printf("Failed to get signed URL for %s: %v", *obj.Key, err)
						continue
					}
					resolutions = append(resolutions, resolutionInfo{
						Quality: quality,
						URL:     signedURL,
					})
					break
				}
			}
		}
	}

	if len(resolutions) == 0 {
		http.Error(w, "no .m3u8 files found in folder", http.StatusNotFound)
		return
	}

	// Trả về JSON chứa danh sách độ phân giải
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]resolutionInfo{
		"resolutions": resolutions,
	})
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api/stream/{movie_id}", streamHandler).Methods("GET")

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:8080", "http://localhost:5173"}),
		handlers.AllowedMethods([]string{"GET", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)

	log.Println("Streaming Service starting on :8002...")
	log.Fatal(http.ListenAndServe(":8002", corsHandler(router)))
}