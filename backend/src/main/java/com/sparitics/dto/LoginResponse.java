package com.sparitics.dto;

public class LoginResponse {

    private String token;
    private String userID;
    private String userType;

    public LoginResponse() {
    }

    public LoginResponse(String token, String userID, String userType) {
        this.token = token;
        this.userID = userID;
        this.userType = userType;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUserID() {
        return userID;
    }

    public void setUserID(String userID) {
        this.userID = userID;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }
}
