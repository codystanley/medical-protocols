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
