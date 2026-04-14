-- Schema initialization for sparitics_web MySQL database
-- Spring Boot runs this automatically via spring.sql.init.mode=always

CREATE TABLE IF NOT EXISTS Users (
    Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    UserID CHAR(200) NOT NULL,
    FullName VARCHAR(1000) NOT NULL,
    PhoneNumber CHAR(200) NOT NULL,
    Password VARCHAR(1000) NOT NULL,
    UserType CHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS PartMaster (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Partnumber VARCHAR(200) NOT NULL,
    Partnumber1 VARCHAR(200) NOT NULL,
    PartDescription VARCHAR(200) NOT NULL,
    category VARCHAR(200) NOT NULL,
    Landedcost DECIMAL(18,4) NOT NULL,
    MRP DECIMAL(18,3) NULL,
    Remark VARCHAR(200) NULL,
    MOQ INT NULL,
    UNIQUE INDEX UQ_PartMaster_Partnumber (Partnumber)
);

CREATE TABLE IF NOT EXISTS tblCounting (
    Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    DealerID INT NOT NULL,
    UserName VARCHAR(200) NOT NULL,
    Partnumber VARCHAR(200) NOT NULL,
    Location VARCHAR(200) NOT NULL,
    Partdesc VARCHAR(200) NOT NULL,
    PartPrice DECIMAL(18,4) NOT NULL,
    count INT NOT NULL,
    Category VARCHAR(200) NOT NULL,
    Remark VARCHAR(200) NOT NULL,
    MOQ INT NOT NULL,
    NotInPartMaster VARCHAR(200) NOT NULL,
    Dateadded DATETIME NOT NULL,
    Datemodi DATETIME NOT NULL,
    Recheck_User VARCHAR(200) NOT NULL,
    Recheck_Count INT NOT NULL,
    Recheck_Remark VARCHAR(200) NOT NULL,
    Recheck_Dateadded DATETIME NOT NULL,
    TransactedPart VARCHAR(20) NOT NULL,
    RecheckFlag VARCHAR(20) NOT NULL,
    Final_Qty INT NOT NULL,
    Countingby VARCHAR(100) NOT NULL,
    modicount INT NOT NULL
);

CREATE TABLE IF NOT EXISTS tblTruncate (
    Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY
);
