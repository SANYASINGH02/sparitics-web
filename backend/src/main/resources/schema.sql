-- Schema initialization for SpariticsWeb database
-- Spring Boot runs this automatically via spring.sql.init.mode=always

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserID NCHAR(200) NOT NULL,
        FullName NCHAR(1000) NOT NULL,
        PhoneNumber NCHAR(200) NOT NULL,
        Password NCHAR(1000) NOT NULL,
        UserType NCHAR(200) NOT NULL
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PartMaster')
BEGIN
    CREATE TABLE PartMaster (
        ID INT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
        Partnumber NVARCHAR(200) NOT NULL,
        Partnumber1 NVARCHAR(200) NOT NULL,
        PartDescription NVARCHAR(200) NOT NULL,
        category NVARCHAR(200) NOT NULL,
        Landedcost DECIMAL(18,4) NOT NULL,
        MRP DECIMAL(18,3) NULL,
        Remark NVARCHAR(200) NULL,
        MOQ INT NULL
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_PartMaster_Partnumber
    ON PartMaster(Partnumber);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblCounting')
BEGIN
    CREATE TABLE tblCounting (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
        DealerID INT NOT NULL,
        UserName NVARCHAR(200) NOT NULL,
        Partnumber NVARCHAR(200) NOT NULL,
        Location NVARCHAR(200) NOT NULL,
        Partdesc NVARCHAR(200) NOT NULL,
        PartPrice DECIMAL(18,4) NOT NULL,
        count INT NOT NULL,
        Category NVARCHAR(200) NOT NULL,
        Remark NVARCHAR(200) NOT NULL,
        MOQ INT NOT NULL,
        NotInPartMaster NVARCHAR(200) NOT NULL,
        Dateadded DATETIME NOT NULL,
        Datemodi DATETIME NOT NULL,
        Recheck_User NVARCHAR(200) NOT NULL,
        Recheck_Count INT NOT NULL,
        Recheck_Remark NVARCHAR(200) NOT NULL,
        Recheck_Dateadded DATETIME NOT NULL,
        TransactedPart NVARCHAR(20) NOT NULL,
        RecheckFlag NVARCHAR(20) NOT NULL,
        Final_Qty INT NOT NULL,
        Countingby NVARCHAR(100) NOT NULL,
        modicount INT NOT NULL
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblTruncate')
BEGIN
    CREATE TABLE tblTruncate (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY
    );
END;
