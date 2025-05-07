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

	"github.com/aws/aws-sdk-go/service/cloudfront/sign"
	"github.com/gorilla/mux"
)

// Cấu hình CloudFront
const (
	distributionDomain = "d1henbbhjbyad4.cloudfront.net" // Thay bằng domain của bạn
	privateKeyPath     = "pk-APKAREOSHZ2RHFQO4IH5.pem"   // Đường dẫn đến private key
	keyPairId          = "APKAREOSHZ2RHFQO4IH5"          // Key Pair ID từ CloudFront
)

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
		return nil, fmt.Errorf("failed to parse private key: %v", err)
	}

	return privateKey, nil
}

// Tạo presigned URL từ CloudFront
func getCloudFrontPresignedURL(key string) (string, error) {
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
	key := fmt.Sprintf("%s/hls/atri13_1080p.m3u8", movieID) // Giả định key dựa trên movie_id

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

	log.Println("Streaming Service starting on :8002...")
	log.Fatal(http.ListenAndServe(":8002", router))
}
