<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peluquería Canina Mundo Can Can</title>
    <link rel="icon" type="img/logo.png" href="img/logo.png">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <img src="img/logo.png" alt="Logo Mundo Can-Can" class="header-logo">
            </div>
        </header>

        <main>

            <div class="alerta-importante">
                <span class="icono">IMPORTANTE</span>
                <div>
                    <br> 
                    En caso de error al seleccionar el tamaño del perro, 
                    el servicio o los adicionales, se cobrará el precio que corresponda según lo 
                    informado en el turno. La responsabilidad de la información correcta es del 
                    cliente al momento de solicitar el turno.
                </div>
            </div>

            <div class="form-wrapper">
                <form id="turnoForm" method="POST" action="guardar.php">
                    <h2>Datos del Turno</h2>
                    
                    <div class="form-group">
                        <label for="nombre_cliente">Tu Nombre Completo *</label>
                        <input type="text" id="nombre_cliente" name="nombre_cliente" required placeholder="Ej: Juan Pérez">
                    </div>

                    <div class="form-group">
                        <label for="telefono">Tu Teléfono *</label>
                        <input type="tel" id="telefono" name="telefono" required placeholder="Ej: 11 1234-5678">
                    </div>

                    <div class="separador">
                        <h3> Datos de las Mascotas</h3>
                    </div>

                    
                    <div id="perrosContainer">
                        
                        <div class="perro-item" data-perro="1">
                            <div class="perro-header">
                                <span class="perro-numero">🐕 Perro #1</span>
                            </div>

                            <div class="form-group">
                                <label>Nombre del Perro *</label>
                                <input type="text" name="perros[0][nombre_perro]" required placeholder="Ej: Toby" class="perro-nombre">
                            </div>

                            <div class="form-group">
                                <label>Tamaño del Perro *</label>
                                <select name="perros[0][id_tamano]" class="select-tamano" required>
                                    <option value="">Seleccione un tamaño</option>
                                    <?php
                                    require 'conexion.php';
                                    $sql_tamano = "SELECT id_tamano, nombre FROM tamano ORDER BY id_tamano";
                                    $resultado_tamano = mysqli_query($conectar, $sql_tamano);
                                    while ($tamano = mysqli_fetch_assoc($resultado_tamano)) {
                                        echo "<option value='" . $tamano['id_tamano'] . "'>";
                                        echo $tamano['nombre'];
                                        echo "</option>";
                                    }
                                    ?>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Tipo de Servicio *</label>
                                <select name="perros[0][id_servicio]" class="select-servicio" required disabled>
                                    <option value="">Primero seleccione el tamaño</option>
                                </select>
                                <small class="help-text">Seleccione primero el tamaño del perro</small>
                            </div>

                        
                            <div class="descripcion-servicio" style="display: none;">
                                <strong> Este servicio incluye:</strong>
                                <p class="texto-descripcion"></p>
                            </div>

                        
                            <div class="adicionales-container">
                                <div class="adicionales-title"> Adicionales (Opcional)</div>
                                
                                <div class="checkbox-item">
                                    <input type="checkbox" name="perros[0][adicionales][]" value="1" id="adicional_1_0">
                                    <label for="adicional_1_0">
                                        ✂️ Corte de uñas 
                                        <span class="checkbox-precio">(+$5000)</span>
                                    </label>
                                </div>

                                <div class="checkbox-item">
                                    <input type="checkbox" name="perros[0][adicionales][]" value="2" id="adicional_2_0">
                                    <label for="adicional_2_0">
                                        🚿 Sanitario 
                                        <span class="checkbox-precio">(+$5000)</span>
                                    </label>
                                </div>
                            </div>

                            <div class="info-box info-precio" style="display: none;">
                                <div class="info-item">
                                    <span class="label">💰 Precio Base:</span>
                                    <span class="value precio-value">-</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">➕ Adicionales:</span>
                                    <span class="value adicionales-value">$0</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">💵 TOTAL:</span>
                                    <span class="value total-value" style="font-weight: bold; font-size: 18px;">-</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Comentarios sobre esta mascota (opcional)</label>
                                <textarea name="perros[0][comentarios]" rows="2" placeholder="Ej: Es nervioso, necesita bozal, etc."></textarea>
                            </div>
                        </div>
                    </div>

                    <button type="button" class="btn-agregar" id="btnAgregarPerro">
                         Agregar otro perro al mismo turno
                    </button>
                    
                    <div class="separador">
                        <h3> Fecha y Horario</h3>
                    </div>

                    <div class="form-group">
                        <label for="fecha">Fecha Deseada *</label>
                        <input type="date" id="fecha" name="fecha" min="<?php echo date('Y-m-d'); ?>" required>
                    </div>

                    <div class="form-group">
                        <label for="hora">Horario Preferido *</label>
                        <select id="hora" name="hora" required>
                            <option value="">Seleccione un horario</option>
                            <option value="11:00:00">11:00</option>
                            <option value="12:00:00">12:00</option>
                            <option value="13:00:00">13:00</option>
                            <option value="14:00:00">14:00</option>
                            <option value="15:00:00">15:00</option>
                            <option value="16:00:00">16:00</option>
                            <option value="17:00:00">17:00</option>
                        </select>
                        <small class="help-text">Los horarios completos se mostrarán deshabilitados</small>
                    </div>

                    <p class="note">* Campos obligatorios</p>
                    <p class="note">
                         Tu turno queda CONFIRMADO automáticamente al enviar
                    </p>

                    <div class="form-group">
                        <label for="descripcion_general">Comentarios generales (opcional)</label>
                        <textarea id="descripcion_general" name="descripcion_general" rows="3" placeholder="Observaciones adicionales sobre el turno..."></textarea>
                    </div>

                    <button type="submit" class="btn-submit" id="submitBtn">
                         Enviar Solicitud por WhatsApp
                    </button>
                </form>

                <div class="info-section">
                    <h3>🐾 Nuestros Servicios</h3>
                    
                    <div class="info-card">
                        <p><strong>🛁 Baño Solo</strong></p>
                        <p>Baño con shampoo, secado, cepillado y perfume</p>
                    </div>

                    <div class="info-card">
                        <p><strong> Corte Solo</strong></p>
                        <p>Corte de pelo + cepillado y perfume</p>
                    </div>

                    <div class="info-card">
                        <p><strong> Corte y Baño</strong></p>
                        <p>Baño completo + corte de pelo + cepillado + perfume + corte de uñas + sanitario</p>

                    <div class="info-card">
                        <p><strong> Adicionales:</strong></p>
                        <p> Corte de uñas: $5000</p>
                        <p> Sanitario: $5000</p>
                    </div>

                    <div class="info-card">
                        <p><strong> Horarios de atención:</strong></p>
                        <p>Lunes a Sábados: 11:00 - 18:00</p>
                        <p>Domingos: Cerrado</p>
                        <p>Feriados: Consultar</p>
                    </div>

                   <div class="ubicacion-section">
                    <h3> Nuestra Ubicación</h3>
             <div class="mapa-container">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.891879655856!2d-58.40861122495576!3d-34.63217247294418!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccbf82adac2a7%3A0x4436b3e0a8dd4dab!2sMundo%20Can-Can%20Sal%C3%B3n%20Canino!5e0!3m2!1ses-419!2sar!4v1761922291112!5m2!1ses-419!2sar" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
             </div>

    <div class="info-direccion">
        <div class="direccion-item">
            <strong> Dirección:</strong>
            <p>La Rioja 1826, Parque Patricios, Buenos Aires</p>
        </div>
                </div>
            </div>
        </main>
    </div>

<div class="bases-footer">
    <button type="button" class="btn-bases" id="btnAbrirBases">
         Ver Bases y Condiciones
    </button>
</div>


<div class="modal-bases" id="modalBases">
    <div class="modal-contenido">
        <div class="modal-header">
            <h2> Bases y Condiciones</h2>
            <button class="btn-cerrar" id="btnCerrarBases">&times;</button>
        </div>
        
        <div class="modal-body">
            <h3>1. Reserva de Turnos</h3>
            <p>• Los turnos quedan CONFIRMADOS automáticamente al enviar el formulario por WhatsApp.</p>
            <p>• Es responsabilidad del cliente verificar que todos los datos sean correctos antes de enviar.</p>
            <p>• Los horarios pueden sufrir modificaciones por causas de fuerza mayor, en cuyo caso nos comunicaremos con el cliente para reprogramar el turno.</p>
            
            <h3>2. Precios y Servicios</h3>
            <p>• Los precios varían según el tamaño del perro (Pequeño, Mediano, Mediano-Grande, Grande, Muy Grande).</p>
            <p>• En caso de error al seleccionar el tamaño o servicio, se cobrará el precio correspondiente al servicio efectivamente prestado.</p>
            <p>• Los precios están sujetos a cambios sin previo aviso.</p>
            <p>• El servicio "Corte y Baño" incluye corte de uñas y sanitario.</p>
            
            <h3>3. Cancelaciones y Reprogramaciones</h3>
            <p>• Las cancelaciones deben realizarse con al menos 24 horas de anticipación.</p>
            <p>• Cancelaciones tardías pueden generar un cargo del 50% del servicio.</p>
            <p>• Las reprogramaciones están sujetas a disponibilidad.</p>
            
            <h3>4. Responsabilidad del Cliente</h3>
            <p>• Es obligatorio informar sobre comportamientos agresivos o problemas de salud de la mascota.</p>
            <p>• El cliente es responsable de la información proporcionada en el formulario.</p>
            
            <h3>5. Salud de las Mascotas</h3>
            <p>• Las mascotas deben estar al día con las vacunas obligatorias.</p>
            <p>• En caso de que el perro presente signos de agresividad o condiciones de salud que impidan la realización del servicio, el personal se reserva el derecho de rechazar o interrumpir la atención.</p>
            <p>• El establecimiento se reserva el derecho de rechazar el servicio si considera que la mascota representa un riesgo.</p>
            
            <h3>6. Formas de Pago</h3>
            <p>• Se aceptan pagos en efectivo, transferencia y tarjetas de crédito/débito.</p>
            <p>• El pago se realiza al finalizar el servicio.</p>
            <p>• No se aceptan cheques.</p>
            
            <h3>7. Horarios</h3>
            <p>• Lunes a Sábados: 11:00 - 17:00</p>
            <p>• Domingos: Cerrado</p>
            <p>• Feriados: Consultar</p>
            
            <h3>8. Política de Privacidad</h3>
            <p>• Los datos personales proporcionados serán utilizados únicamente para la gestión de turnos.</p>
            <p>• No compartimos información personal con terceros.</p>
            <p>• El cliente puede solicitar la eliminación de sus datos en cualquier momento.</p>
            
            <h3>9. Propiedad Intelectual</h3> 
            <p>• Todo el contenido del sitio (textos, imágenes, logotipos, diseño y código fuente) es propiedad de "Mundo Can-Can" o de sus respectivos autores, y está protegido por las leyes de propiedad intelectual. Queda prohibida su reproducción o uso sin autorización previa.</p> 
            
            <h3>10. Aceptación de Términos</h3>
            <p>• Al enviar el formulario de reserva, el cliente acepta estos términos y condiciones.</p>
            <p>• El establecimiento se reserva el derecho de modificar estos términos en cualquier momento.</p>
        </div>
        
        <div class="modal-footer">
            <button class="btn-aceptar" id="btnAceptarBases">✅ Entendido</button>
        </div>
    </div>
</div>

    <script>
        const serviciosData = <?php
            $sql_servicios = "SELECT id_servicio, nombre, descripcion, 
                             precio_pequeno, precio_mediano, precio_mediano_grande, precio_grande, precio_muy_grande 
                             FROM servicio WHERE activo = 1 ORDER BY nombre";
            $resultado_servicios = mysqli_query($conectar, $sql_servicios);
            $servicios = [];
            while ($servicio = mysqli_fetch_assoc($resultado_servicios)) {
                $servicios[] = $servicio;
            }
            mysqli_close($conectar);
            echo json_encode($servicios);
        ?>;
    </script>

    <script src="script.js"></script>
</body>
</html>
