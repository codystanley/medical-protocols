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

// 2. Get and Validate AlgorithmID
if (!isset($_GET['AlgorithmID']) || !is_numeric($_GET['AlgorithmID'])) {  // Changed to AlgorithmID
    $response = ["error" => "Invalid or missing AlgorithmID"];
    echo json_encode($response);
    exit;
}
$algorithmID = (int)$_GET['AlgorithmID']; 

// 3. Prepare and Execute SQL Query (fetch questions with sorting)
// Join with Disposition table to get DispositionHeading
$sql = "SELECT Question.QuestionID, Question.Question, Disposition.DispositionHeading, Disposition.LevelID, Question.Information 
FROM Question 
INNER JOIN Disposition ON Question.DispositionLevel = Disposition.LevelID 
LEFT JOIN QuestionStatus ON Question.QuestionID = QuestionStatus.QuestionID AND QuestionStatus.EncounterID = ?
WHERE Question.AlgorithmID = ? 
ORDER BY Disposition.LevelID DESC, Question.QuestionOrder ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $algorithmID, $algorithmID); 
$stmt->execute();
$result = $stmt->get_result();


// 4. Create Array of Questions, Grouped by DispositionHeading
$questionsByHeading = [];
while($row = $result->fetch_assoc()) {
    $dispositionHeading = $row['DispositionHeading'];
    if (!isset($questionsByHeading[$dispositionHeading])) {
        $questionsByHeading[$dispositionHeading] = [];
    }

    $question = [
        'QuestionID' => $row['QuestionID'],
        'Question' => $row['Question'],
        'Information' => $row['Information'],
        'Status' => $row['Status'] ?? 'normal'
    ];

    $questionsByHeading[$dispositionHeading][] = $question;
}

// 5. Close Database Connection
$stmt->close();
$conn->close();

// 6. Return Questions as JSON
header('Content-Type: application/json');
echo json_encode($questionsByHeading);
?>