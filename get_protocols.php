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

// 2. Query Adult Protocols Table Directly
$sql = "SELECT AlgorithmID,Title FROM Algorithm ORDER BY Title ASC"; 
$result = $conn->query($sql);

// 3. Create Array of Protocol Names
$protocols = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $protocols[] = [
            'title' => $row['Title'],
            'algorithmID' => $row['AlgorithmID']
        ];
    }
}

// 4. Close Database Connection
$conn->close();

// 5. Return Protocol Names as JSON
header('Content-Type: application/json');
echo json_encode($protocols);
?>
