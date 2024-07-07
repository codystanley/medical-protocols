<?php
// 1. Database Connection (replace placeholders with your actual credentials)
require_once 'config.php';

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    // Handle the error in a way that returns valid JSON
    $response = ["error" => "Database connection failed: " . $conn->connect_error];
    echo json_encode($response);
    exit; // Terminate script execution
}

// 2. Get and Validate AlgorithmID
if (!isset($_GET['AlgorithmID']) || !is_numeric($_GET['AlgorithmID'])) {  
    $error_message = "Invalid or missing AlgorithmID: " . $_GET['AlgorithmID']; 
    error_log($error_message); // Log the specific error
    echo json_encode(["error" => $error_message]);
    exit;
}
$algorithmID = (int)$_GET['AlgorithmID']; 

// 3. Create New Encounter Record
$sql = "INSERT INTO Encounters (AlgorithmID, StartTime, Status) VALUES (?, NOW(), 'in_progress')";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $algorithmID);
if (!$stmt->execute()) {
    $error_message = "Error creating encounter: " . $stmt->error;
    error_log($error_message); // Log the SQL error
    echo json_encode(["error" => $error_message]);
    exit;
}
$stmt->execute();

// 4. Get the Generated EncounterID
$encounterID = $stmt->insert_id;

// 5. Close Resources
$stmt->close();
$conn->close();

// 6. Return EncounterID as JSON
header('Content-Type: application/json');
echo json_encode(["encounterID" => $encounterID]);
