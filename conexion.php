<?php

$servername = "localhost";
$username = "mundocancan";
$password = "ZY5+l]MLFn,[";
$database = "mundocan_pel_can";

$conectar = mysqli_connect($servername, $username, $password, $database);

if (!$conectar) {
    die("Error de conexión: " . mysqli_connect_error());
}

mysqli_set_charset($conectar, "utf8");