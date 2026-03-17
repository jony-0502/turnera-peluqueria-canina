<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'conexion.php';

if (!$conectar) {
    die(json_encode([
        'error' => true,
        'mensaje' => 'Error de conexión a la base de datos'
    ]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $nombre_cliente = mysqli_real_escape_string($conectar, trim($_POST['nombre_cliente']));
    $telefono       = mysqli_real_escape_string($conectar, trim($_POST['telefono']));
    $fecha          = mysqli_real_escape_string($conectar, $_POST['fecha']);
    $hora           = mysqli_real_escape_string($conectar, $_POST['hora']);
    $descripcion_general = isset($_POST['descripcion_general']) ? mysqli_real_escape_string($conectar, trim($_POST['descripcion_general'])) : '';
    
    $perros = isset($_POST['perros']) ? $_POST['perros'] : [];
    
    if (empty($perros)) {
        echo json_encode([
            'error' => true,
            'mensaje' => 'Debe agregar al menos un perro'
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    if (empty($nombre_cliente) || empty($telefono) || empty($fecha) || empty($hora)) {
        echo json_encode([
            'error' => true,
            'mensaje' => 'Complete todos los campos obligatorios'
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    $fecha_actual = date('Y-m-d');
    if ($fecha < $fecha_actual) {
        echo json_encode([
            'error' => true,
            'mensaje' => 'No puede seleccionar una fecha pasada'
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    $check_turno = "SELECT COUNT(*) as total FROM turno_cliente 
                    WHERE fecha = '$fecha' 
                    AND hora = '$hora' 
                    AND estado NOT IN ('Cancelado')";
    $resultado_turno = mysqli_query($conectar, $check_turno);
    
    if (!$resultado_turno) {
        echo json_encode([
            'error' => true,
            'mensaje' => 'Error al verificar disponibilidad: ' . mysqli_error($conectar)
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    $row = mysqli_fetch_assoc($resultado_turno);
    $turnos_existentes = (int)$row['total'];
    $perros_a_agregar = count($perros);
    $total_perros = $turnos_existentes + $perros_a_agregar;
    
    if ($total_perros > 2) {
        echo json_encode([
            'error' => true,
            'mensaje' => "Este horario ya tiene $turnos_existentes perro(s) reservado(s). No hay espacio suficiente."
        ]);
        mysqli_close($conectar);
        exit;
    }
    
    mysqli_begin_transaction($conectar);
    
    try {
        $precio_total_general = 0;
        $turnos_insertados = [];
        
        foreach ($perros as $index => $perro) {
            
            if (empty($perro['nombre_perro']) || empty($perro['id_tamano']) || empty($perro['id_servicio'])) {
                throw new Exception("Datos incompletos para el perro #" . ($index + 1));
            }
            
            $nombre_perro    = mysqli_real_escape_string($conectar, trim($perro['nombre_perro']));
            $id_tamano       = (int)$perro['id_tamano'];
            $id_servicio     = (int)$perro['id_servicio'];
            $comentarios     = isset($perro['comentarios']) ? mysqli_real_escape_string($conectar, trim($perro['comentarios'])) : '';

            $check_tamano = "SELECT id_tamano FROM tamano WHERE id_tamano = $id_tamano";
            $resultado_tamano = mysqli_query($conectar, $check_tamano);
            
            if (!$resultado_tamano) {
                throw new Exception("Error al validar tamaño: " . mysqli_error($conectar));
            }
            
            if (mysqli_num_rows($resultado_tamano) == 0) {
                throw new Exception("El tamaño seleccionado para {$nombre_perro} no es válido");
            }
        
            $check_servicio = "SELECT id_servicio FROM servicio WHERE id_servicio = $id_servicio AND activo = 1";
            $resultado_servicio = mysqli_query($conectar, $check_servicio);
            
            if (!$resultado_servicio) {
                throw new Exception("Error al validar servicio: " . mysqli_error($conectar));
            }
            
            if (mysqli_num_rows($resultado_servicio) == 0) {
                throw new Exception("El servicio seleccionado para {$nombre_perro} no es válido");
            }
            
            $sql_precio = "SELECT 
                            CASE 
                                WHEN $id_tamano = 1 THEN precio_pequeno
                                WHEN $id_tamano = 2 THEN precio_mediano
                                WHEN $id_tamano = 3 THEN precio_mediano_grande
                                WHEN $id_tamano = 4 THEN precio_grande
                                WHEN $id_tamano = 5 THEN precio_muy_grande
                                ELSE 0
                            END as precio
                           FROM servicio 
                           WHERE id_servicio = $id_servicio";
            $resultado_precio = mysqli_query($conectar, $sql_precio);
            
            if (!$resultado_precio) {
                throw new Exception("Error al obtener precio: " . mysqli_error($conectar));
            }
            
            $row_precio = mysqli_fetch_assoc($resultado_precio);
            $precio_base = $row_precio['precio'];
            
            if ($precio_base <= 0) {
                throw new Exception("Precio no válido para {$nombre_perro}");
            }
            
            $precio_adicionales = 0;
            $adicionales_texto = [];
            
            if (isset($perro['adicionales']) && is_array($perro['adicionales'])) {
                foreach ($perro['adicionales'] as $id_adicional) {
                    if ($id_adicional == 1) {
                        $precio_adicionales += 5000;
                        $adicionales_texto[] = "Corte de uñas";
                    }
                    if ($id_adicional == 2) {
                        $precio_adicionales += 5000;
                        $adicionales_texto[] = "Sanitario";
                    }
                }
            }
            
            $precio_total_perro = $precio_base + $precio_adicionales;
            $precio_total_general += $precio_total_perro;
            
            $descripcion_completa = $comentarios;
            if (!empty($adicionales_texto)) {
                $descripcion_completa .= (!empty($descripcion_completa) ? " | " : "") . "Adicionales: " . implode(", ", $adicionales_texto);
            }
            if (!empty($descripcion_general) && $index == 0) {
                $descripcion_completa .= (!empty($descripcion_completa) ? " | " : "") . "Comentarios generales: " . $descripcion_general;
            }
        
            $sql = "INSERT INTO turno_cliente 
                    (nombre_cliente, nombre_perro, telefono, id_tamano, id_servicio, 
                     fecha, hora, descripcion, precio_total, estado) 
                    VALUES 
                    ('$nombre_cliente', '$nombre_perro', '$telefono', $id_tamano, 
                     $id_servicio, '$fecha', '$hora', '$descripcion_completa', $precio_total_perro, 'Pendiente')";
            
            if (!mysqli_query($conectar, $sql)) {
                throw new Exception("Error al guardar el turno para {$nombre_perro}: " . mysqli_error($conectar));
            }
            
            $turno_id = mysqli_insert_id($conectar);
            
            if (isset($perro['adicionales']) && is_array($perro['adicionales'])) {
                $check_tabla = mysqli_query($conectar, "SHOW TABLES LIKE 'turno_adicionales'");
                if (mysqli_num_rows($check_tabla) > 0) {
                    foreach ($perro['adicionales'] as $id_adicional) {
                        $sql_adicional = "INSERT INTO turno_adicionales (id_turno, id_adicional) 
                                         VALUES ($turno_id, $id_adicional)";
                        mysqli_query($conectar, $sql_adicional);
                    }
                }
            }
            
            $turnos_insertados[] = [
                'id' => $turno_id,
                'nombre_perro' => $nombre_perro,
                'precio' => $precio_total_perro
            ];
        }
        
        mysqli_commit($conectar);
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Turnos guardados correctamente',
            'turnos' => $turnos_insertados,
            'total' => $precio_total_general
        ]);
        
    } catch (Exception $e) {
        mysqli_rollback($conectar);
        
        echo json_encode([
            'error' => true,
            'mensaje' => $e->getMessage()
        ]);
    }
    
} else {
    echo json_encode([
        'error' => true,
        'mensaje' => 'Método no permitido'
    ]);
}

mysqli_close($conectar);