<?php
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

// Get data from the request
$data = json_decode(file_get_contents("php://input"), true); // Get raw JSON data from POST
$encounterID = $data['encounterID'];
$questions = $data['questions'];
$advice = $data['advice'];


// Update encounter status to 'completed'
$updateEncounterSql = "UPDATE Encounters SET Status = 'completed', EndTime = NOW() WHERE EncounterID = ?";
$updateEncounterStmt = $conn->prepare($updateEncounterSql);
$updateEncounterStmt->bind_param("i", $encounterID);
$updateEncounterStmt->execute();

// Save question statuses
$insertQuestionStatusSql = "INSERT INTO QuestionStatus (EncounterID, QuestionID, Status) VALUES (?, ?, ?)";
$insertQuestionStatusStmt = $conn->prepare($insertQuestionStatusSql);
foreach ($questions as $question) {
    $insertQuestionStatusStmt->bind_param("iis", $encounterID, $question['questionID'], $question['status']);
    $insertQuestionStatusStmt->execute();
}

// Save advice selections (only if the question was marked red)
$insertAdviceSql = "INSERT INTO EncounterDetails (EncounterID, QuestionID, AdviceID) VALUES (?, ?, ?)";
$insertAdviceStmt = $conn->prepare($insertAdviceSql);
foreach ($advice as $adviceItem) {
    $insertAdviceStmt->bind_param("iii", $encounterID, $adviceItem['questionID'], $adviceItem['adviceID']);
    $insertAdviceStmt->execute();
}

// Close resources
$updateEncounterStmt->close();
$insertQuestionStatusStmt->close();
$insertAdviceStmt->close();
$conn->close();

echo json_encode(["message" => "Encounter details saved successfully"]);
