package main

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"
	"os"
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
	bucketName         = "movie-streaming-dest" // Thêm bucket name
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

	// Kiểm tra file private key tồn tại
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

	// Decode PEM block
	block, _ := pem.Decode(privateKeyBytes)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block containing private key")
	}

	// Parse private key
	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		// Thử parse định dạng PKCS8 nếu PKCS1 thất bại
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
	// Kiểm tra file tồn tại trên S3
	exists, err := checkFileExists(key)
	if err != nil || !exists {
		return "", fmt.Errorf("file %s does not exist on S3: %v", key, err)
	}

	privateKey, err := loadPrivateKey(privateKeyPath)
	if err != nil {
		return "", fmt.Errorf("failed to load private key: %v", err)
	}

	// Tạo URL gốc
	url := fmt.Sprintf("https://%s/%s", distributionDomain, key)

	// Tạo signer
	signer := sign.NewURLSigner(keyPairId, privateKey)

	// Tạo presigned URL
	signedURL, err := signer.Sign(url, time.Now().Add(3600*time.Second)) // Hiệu lực 1 giờ
	if err != nil {
		return "", fmt.Errorf("failed to sign URL: %v", err)
	}

	return signedURL, nil
}

// Handler cho API /api/stream/{movie_id}
func streamHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	movieID := vars["movie_id"]
	key := fmt.Sprintf("%s/hls/alo_1080p.m3u8", movieID)

	signedURL, err := getCloudFrontPresignedURL(key)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, signedURL)
}

func main() {
	router := mux.NewRouter()
	router.HandleFunc("/api/stream/{movie_id}", streamHandler).Methods("GET")

	// Thêm middleware CORS
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:5173"}),
		handlers.AllowedMethods([]string{"GET", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)

	log.Println("Streaming Service starting on :8002...")
	log.Fatal(http.ListenAndServe(":8002", corsHandler(router)))
}
