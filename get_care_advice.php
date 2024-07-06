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


// Get and validate QuestionID
if (!isset($_GET['QuestionID']) || !is_numeric($_GET['QuestionID'])) {  
    $response = ["error" => "Invalid or missing QuestionID"];
    echo json_encode($response);
    exit;
}
$questionID = (int)$_GET['QuestionID']; 

// Fetch AdviceIDs for the given QuestionID
$sql = "SELECT AdviceID FROM QuestionAdvice WHERE QuestionID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $questionID);
$stmt->execute();
$result = $stmt->get_result();

$adviceIDs = [];
while ($row = $result->fetch_assoc()) {
    $adviceIDs[] = $row['AdviceID'];
}

// Fetch Care Advice based on the AdviceIDs
$advice = [];
if (!empty($adviceIDs)) {
    $in = str_repeat('?,', count($adviceIDs) - 1) . '?';
    $adviceSql = "SELECT Advice FROM Advice WHERE AdviceID IN ($in)";
    $adviceStmt = $conn->prepare($adviceSql);
    $types = str_repeat('i', count($adviceIDs)); // Type specifier for all IDs
    $adviceStmt->bind_param($types, ...$adviceIDs); // Bind the parameters
    $adviceStmt->execute();
    $adviceResult = $adviceStmt->get_result();

    while ($row = $adviceResult->fetch_assoc()) {
        $advice[] = $row['Advice'];
    }
}

$stmt->close();
$conn->close();

// Return Care Advice as JSON
header('Content-Type: application/json');
echo json_encode($advice); 
