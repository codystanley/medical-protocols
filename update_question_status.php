<?php
// 1. Database Connection (replace placeholders with your actual credentials)
$servername = "34.150.221.231";
$username = "triage_mtc";
$password = "iNH)J1iY]V4/F#Z-";
$dbname = "AAH_2024";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    // Handle the error in a way that returns valid JSON
    $response = ["error" => "Database connection failed: " . $conn->connect_error];
    echo json_encode($response);
    exit; // Terminate script execution
}

    // Get and validate parameters
if (!isset($_POST['encounterID'], $_POST['questionID'], $_POST['status'])) {
    die("Missing required parameters");
}

$encounterID = (int)$_POST['encounterID'];
$questionID = (int)$_POST['questionID'];
$newStatus = $_POST['status'];

// Check if status is valid
$allowedStatuses = ['normal', 'red', 'green'];
if (!in_array($newStatus, $allowedStatuses)) {
    die("Invalid status");
}

// Check if a record already exists for this encounter and question
$checkSql = "SELECT StatusID FROM QuestionStatus WHERE EncounterID = ? AND QuestionID = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("ii", $encounterID, $questionID);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    // Update existing record
    $updateSql = "UPDATE QuestionStatus SET Status = ? WHERE EncounterID = ? AND QuestionID = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("sii", $newStatus, $encounterID, $questionID);
    $updateStmt->execute();
} else {
    // Insert new record
    $insertSql = "INSERT INTO QuestionStatus (EncounterID, QuestionID, Status) VALUES (?, ?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param("iis", $encounterID, $questionID, $newStatus);
    $insertStmt->execute();
}

$conn->close();
echo "Status updated successfully"; 