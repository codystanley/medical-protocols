<?php
// 1. Database Connection (replace placeholders with your actual credentials)
$servername = "34.150.221.231";
$username = "triage_mtc";
$password = "iNH)J1iY]V4/F#Z-";
$dbname = "AAH_2024";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
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
