package com.movie.userservice.dto;

import lombok.Data;

@Data
public class UserResponse {
    private String username;
    private String email;
    private String token;

    public UserResponse(String username, String email, String token) {
        this.username = username;
        this.email = email;
        this.token = token;
    }
}