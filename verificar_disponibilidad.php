<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require 'conexion.php';

if (!$conectar) {
    echo json_encode([
        'error' => true,
        'mensaje' => 'Error de conexión a la base de datos'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Verificar si es petición para obtener horarios
    if (isset($_POST['accion']) && $_POST['accion'] === 'obtener_horarios') {
        $fecha = isset($_POST['fecha']) ? mysqli_real_escape_string($conectar, trim($_POST['fecha'])) : '';
        
        if (empty($fecha)) {
            echo json_encode([
                'error' => true,
                'mensaje' => 'Fecha requerida'
            ]);
            mysqli_close($conectar);
            exit;
        }
        
        $horarios_disponibles = [
            '11:00:00' => '11:00',
            '12:00:00' => '12:00',
            '13:00:00' => '13:00',
            '14:00:00' => '14:00',
            '15:00:00' => '15:00',
            '16:00:00' => '16:00',
            '17:00:00' => '17:00'
        ];
        
        $horarios_resultado = [];
        
        foreach ($horarios_disponibles as $hora => $hora_formato) {
            $sql = "SELECT COUNT(*) as total 
                    FROM turno_cliente 
                    WHERE fecha = '$fecha' 
                    AND hora = '$hora' 
                    AND estado NOT IN ('Cancelado')";
            
            $resultado = mysqli_query($conectar, $sql);
            $row = mysqli_fetch_assoc($resultado);
            $total_perros = (int)$row['total'];
            
            $horarios_resultado[] = [
                'hora' => $hora,
                'hora_formato' => $hora_formato,
                'completo' => $total_perros >= 2,
                'espacios_disponibles' => 2 - $total_perros,
                'perros_actuales' => $total_perros
            ];
        }
        
        echo json_encode([
            'horarios' => $horarios_resultado
        ]);
        
        mysqli_close($conectar);
        exit;
    }
    
    // Verificación normal de disponibilidad
    $fecha = isset($_POST['fecha']) ? mysqli_real_escape_string($conectar, trim($_POST['fecha'])) : '';
    $hora = isset($_POST['hora']) ? mysqli_real_escape_string($conectar, trim($_POST['hora'])) : '';
    
    if (empty($fecha) || empty($hora)) {
        echo json_encode([
            'error' => true,
            'mensaje' => 'Fecha y hora son obligatorios'
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    $fecha_valida = DateTime::createFromFormat('Y-m-d', $fecha);
    if (!$fecha_valida || $fecha_valida->format('Y-m-d') !== $fecha) {
        echo json_encode([
            'error' => true,
            'mensaje' => 'Formato de fecha inválido'
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    $fecha_actual = date('Y-m-d');
    if ($fecha < $fecha_actual) {
        echo json_encode([
            'disponible' => false,
            'mensaje' => '❌ No se pueden reservar fechas pasadas'
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    $sql = "SELECT COUNT(*) as total 
            FROM turno_cliente 
            WHERE fecha = '$fecha' 
            AND hora = '$hora' 
            AND estado NOT IN ('Cancelado')";
    
    $resultado = mysqli_query($conectar, $sql);
    
    if (!$resultado) {
        echo json_encode([
            'error' => true,
            'mensaje' => 'Error en consulta: ' . mysqli_error($conectar)
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    $row = mysqli_fetch_assoc($resultado);
    $total_perros = (int)$row['total'];
    
    if ($total_perros >= 2) {
        echo json_encode([
            'disponible' => false,
            'mensaje' => '❌ Este horario está completo',
            'ocupado' => true,
            'perros_actuales' => $total_perros
        ]);
    } else if ($total_perros == 1) {
        echo json_encode([
            'disponible' => true,
            'mensaje' => '⚠️ Este horario tiene 1 espacio ocupado. Solo queda 1 espacio disponible',
            'espacios_disponibles' => 1,
            'perros_actuales' => $total_perros
        ]);
    } else {
        echo json_encode([
            'disponible' => true,
            'mensaje' => '✅ Este horario está disponible',
            'espacios_disponibles' => 2,
            'perros_actuales' => 0
        ]);
    }
    
    mysqli_close($conectar);
    
} else {
    echo json_encode([
        'error' => true,
        'mensaje' => 'Método no permitido'
    ]);
}