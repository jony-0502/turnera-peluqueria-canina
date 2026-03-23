const NUMERO_WHATSAPP = '54911223355';

let contadorPerros = 1;
let timeoutVerificacion = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log(' Sistema cargado correctamente');
    
    const primerPerro = document.querySelector('.perro-item');
    if (primerPerro) {
        inicializarEventosPerro(primerPerro);
    }
    
    configurarFecha();
    deshabilitarFechasBloqueadas();
    
    const btnAgregar = document.getElementById('btnAgregarPerro');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', agregarNuevoPerro);
    }

    const form = document.getElementById('turnoForm');
    if (form) {
        form.addEventListener('submit', procesarFormulario);
    }

    const btnAbrirBases = document.getElementById('btnAbrirBases');
    const btnCerrarBases = document.getElementById('btnCerrarBases');
    const btnAceptarBases = document.getElementById('btnAceptarBases');
    const modalBases = document.getElementById('modalBases');
    
    if (btnAbrirBases && modalBases) {
        btnAbrirBases.addEventListener('click', function() {
            modalBases.classList.add('activo');
            document.body.style.overflow = 'hidden'; 
        });

        if (btnCerrarBases) {
            btnCerrarBases.addEventListener('click', cerrarModal);
        }

        if (btnAceptarBases) {
            btnAceptarBases.addEventListener('click', cerrarModal);
        }

        modalBases.addEventListener('click', function(e) {
            if (e.target === modalBases) {
                cerrarModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalBases.classList.contains('activo')) {
                cerrarModal();
            }
        });
    }
    
    function cerrarModal() {
        if (modalBases) {
            modalBases.classList.remove('activo');
            document.body.style.overflow = '';
        }
    }

    const fechaInput = document.getElementById('fecha');
    const horaInput = document.getElementById('hora');
    
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            cargarHorariosDisponibles(this.value);
            clearTimeout(timeoutVerificacion);
            timeoutVerificacion = setTimeout(verificarDisponibilidadTurno, 300);
        });
    }
    
    if (horaInput) {
        horaInput.addEventListener('change', function() {
            clearTimeout(timeoutVerificacion);
            timeoutVerificacion = setTimeout(verificarDisponibilidadTurno, 300);
        });
    }
});

function deshabilitarFechasBloqueadas() {
    const fechaInput = document.getElementById('fecha');
    if (!fechaInput) return;
    
    fechaInput.addEventListener('input', function() {
        const fechaSeleccionada = new Date(this.value + 'T00:00:00');
        const diaSemana = fechaSeleccionada.getDay();
        
        if (diaSemana === 0) {
            alert(' Los domingos no trabajamos. Por favor selecciona otro día.');
            this.value = '';
        }
    });
}

async function cargarHorariosDisponibles(fecha) {
    const horaSelect = document.getElementById('hora');
    if (!horaSelect || !fecha) return;
    
    try {
        const formData = new FormData();
        formData.append('fecha', fecha);
        formData.append('accion', 'obtener_horarios');
        
        const response = await fetch('verificar_disponibilidad.php', {
            method: 'POST',
            body: formData
        });
        
        const resultado = await response.json();
        
        if (resultado.horarios) {
            const horaActual = horaSelect.value;
            horaSelect.innerHTML = '<option value="">Seleccione un horario</option>';
            
            resultado.horarios.forEach(horario => {
                const option = document.createElement('option');
                option.value = horario.hora;
                
                if (horario.completo) {
                    option.textContent = `${horario.hora_formato} - COMPLETO`;
                    option.disabled = true;
                    option.style.color = '#999';
                    option.style.fontWeight = 'bold';
                    option.style.backgroundColor = '#f0f0f0';
                } else if (horario.espacios_disponibles === 1) {
                    option.textContent = `${horario.hora_formato} - 1 espacio`;
                } else {
                    option.textContent = horario.hora_formato;
                }
                
                horaSelect.appendChild(option);
            });
            
            if (horaActual && !resultado.horarios.find(h => h.hora === horaActual && h.completo)) {
                horaSelect.value = horaActual;
            }
        }
    } catch (error) {
        console.error('Error al cargar horarios:', error);
    }
}

async function verificarDisponibilidadTurno() {
    const fechaInput = document.getElementById('fecha');
    const horaInput = document.getElementById('hora');
    const submitBtn = document.getElementById('submitBtn');
    
    const fecha = fechaInput.value;
    const hora = horaInput.value;
    
    const mensajePrevio = document.getElementById('mensaje-disponibilidad');
    if (mensajePrevio) {
        mensajePrevio.remove();
    }
    
    if (!fecha || !hora) {
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    
    mostrarMensajeDisponibilidad('🔍 Verificando disponibilidad...', 'verificando');
    
    try {
        const formData = new FormData();
        formData.append('fecha', fecha);
        formData.append('hora', hora);
        
        const response = await fetch('verificar_disponibilidad.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        const resultado = await response.json();
        
        if (resultado.error) {
            mostrarMensajeDisponibilidad('⚠️ ' + resultado.mensaje, 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        if (resultado.disponible) {
            let mensaje = resultado.mensaje;
            
            if (resultado.espacios_disponibles === 1) {
                const totalPerros = document.querySelectorAll('.perro-item').length;
                if (totalPerros > 1) {
                    mensaje = '⚠️ Este horario tiene 1 espacio ocupado. Solo queda 1 espacio disponible.\n\nTienes ' + totalPerros + ' perros. Por favor elige otro horario o reduce a 1 perro.';
                    mostrarMensajeDisponibilidad(mensaje, 'ocupado');
                    if (submitBtn) submitBtn.disabled = true;
                    return;
                }
            }
            
            mostrarMensajeDisponibilidad(mensaje, resultado.espacios_disponibles === 1 ? 'advertencia' : 'disponible');
            
            const totalPerros = document.querySelectorAll('.perro-item').length;
            if (totalPerros > resultado.espacios_disponibles) {
                if (submitBtn) submitBtn.disabled = true;
            } else {
                if (submitBtn) submitBtn.disabled = false;
            }
        } else {
            mostrarMensajeDisponibilidad(resultado.mensaje, 'ocupado');
            if (submitBtn) submitBtn.disabled = true;
        }
        
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        mostrarMensajeDisponibilidad('⚠️ Error de conexión. Verifique su red.', 'error');
        if (submitBtn) submitBtn.disabled = false;
    }
}

function mostrarMensajeDisponibilidad(texto, tipo) {
    const horaInput = document.getElementById('hora');
    if (!horaInput) return;
    
    const mensajePrevio = document.getElementById('mensaje-disponibilidad');
    if (mensajePrevio) {
        mensajePrevio.remove();
    }
    
    const mensaje = document.createElement('div');
    mensaje.id = 'mensaje-disponibilidad';
    mensaje.className = 'mensaje-disponibilidad ' + tipo;
    mensaje.textContent = texto;
    
    horaInput.parentNode.appendChild(mensaje);
}

function inicializarEventosPerro(perroItem) {
    const selectTamano = perroItem.querySelector('.select-tamano');
    const selectServicio = perroItem.querySelector('.select-servicio');
    const infoPrecio = perroItem.querySelector('.info-precio');
    const descripcionDiv = perroItem.querySelector('.descripcion-servicio');

    if (!selectTamano || !selectServicio) {
        console.error('❌ No se encontraron los selectores necesarios');
        return;
    }

    selectTamano.addEventListener('change', function() {
        const tamanoId = parseInt(this.value);
        
        selectServicio.innerHTML = '<option value="">Seleccione un servicio</option>';
        
        if (tamanoId && typeof serviciosData !== 'undefined') {
            selectServicio.disabled = false;
            
            serviciosData.forEach(servicio => {
                const option = document.createElement('option');
                option.value = servicio.id_servicio;
                option.setAttribute('data-pequeno', servicio.precio_pequeno || 0);
                option.setAttribute('data-mediano', servicio.precio_mediano || 0);
                option.setAttribute('data-mediano-grande', servicio.precio_mediano_grande || 0);
                option.setAttribute('data-grande', servicio.precio_grande || 0);
                option.setAttribute('data-muy-grande', servicio.precio_muy_grande || 0);
                option.setAttribute('data-descripcion', servicio.descripcion || '');
                option.setAttribute('data-nombre', servicio.nombre || '');
                
                let precio = 0;
                if (tamanoId == 1) precio = servicio.precio_pequeno;
                else if (tamanoId == 2) precio = servicio.precio_mediano;
                else if (tamanoId == 3) precio = servicio.precio_mediano_grande;
                else if (tamanoId == 4) precio = servicio.precio_grande;
                else if (tamanoId == 5) precio = servicio.precio_muy_grande;
                
                option.textContent = `${servicio.nombre} - $${parseFloat(precio).toFixed(2)}`;
                selectServicio.appendChild(option);
            });
        } else {
            selectServicio.disabled = true;
        }
        
        if (infoPrecio) infoPrecio.style.display = 'none';
        if (descripcionDiv) descripcionDiv.style.display = 'none';
        
        desbloquearAdicionales(perroItem);
    });
    
    selectServicio.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const tamanoId = parseInt(selectTamano.value);
        
        if (this.value && tamanoId) {
            let precioBase = 0;
            if (tamanoId == 1) precioBase = parseFloat(selectedOption.getAttribute('data-pequeno'));
            else if (tamanoId == 2) precioBase = parseFloat(selectedOption.getAttribute('data-mediano'));
            else if (tamanoId == 3) precioBase = parseFloat(selectedOption.getAttribute('data-mediano-grande'));
            else if (tamanoId == 4) precioBase = parseFloat(selectedOption.getAttribute('data-grande'));
            else if (tamanoId == 5) precioBase = parseFloat(selectedOption.getAttribute('data-muy-grande'));
            
            const descripcion = selectedOption.getAttribute('data-descripcion');
            const nombreServicio = selectedOption.getAttribute('data-nombre').toLowerCase();
            
            const precioValue = perroItem.querySelector('.precio-value');
            const textoDescripcion = perroItem.querySelector('.texto-descripcion');
            
            if (precioValue) precioValue.textContent = '$' + precioBase.toFixed(2);

            if (descripcion && descripcionDiv && textoDescripcion) {
                textoDescripcion.textContent = descripcion;
                descripcionDiv.style.display = 'block';
            }
            
            if (nombreServicio.includes('corte y baño') || nombreServicio.includes('corte y bano')) {
                bloquearAdicionales(perroItem, 'Este servicio ya incluye corte de uñas y sanitario');
            } else {
                desbloquearAdicionales(perroItem);
            }
            
            calcularTotal(perroItem);
            if (infoPrecio) infoPrecio.style.display = 'block';
        } else {
            if (infoPrecio) infoPrecio.style.display = 'none';
            if (descripcionDiv) descripcionDiv.style.display = 'none';
            desbloquearAdicionales(perroItem);
        }
    });

    const checkboxes = perroItem.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            calcularTotal(perroItem);
        });
    });
}

function bloquearAdicionales(perroItem, mensaje) {
    const checkboxes = perroItem.querySelectorAll('.checkbox-item input[type="checkbox"]');
    const adicionalesContainer = perroItem.querySelector('.adicionales-container');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = true;
    });
    
    let mensajeExistente = perroItem.querySelector('.mensaje-adicionales-bloqueados');
    if (!mensajeExistente) {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = 'mensaje-adicionales-bloqueados';
        mensajeDiv.innerHTML = `
            <span style="color: #667eea; font-weight: bold;">ℹ️ ${mensaje}</span>
        `;
        adicionalesContainer.insertBefore(mensajeDiv, adicionalesContainer.firstChild.nextSibling);
    }
    
    adicionalesContainer.classList.add('adicionales-deshabilitados');
}

function desbloquearAdicionales(perroItem) {
    const checkboxes = perroItem.querySelectorAll('.checkbox-item input[type="checkbox"]');
    const adicionalesContainer = perroItem.querySelector('.adicionales-container');
    
    checkboxes.forEach(checkbox => {
        checkbox.disabled = false;
    });
    
    const mensajeExistente = perroItem.querySelector('.mensaje-adicionales-bloqueados');
    if (mensajeExistente) {
        mensajeExistente.remove();
    }
    
    adicionalesContainer.classList.remove('adicionales-deshabilitados');
}

function calcularTotal(perroItem) {
    const selectServicio = perroItem.querySelector('.select-servicio');
    const selectTamano = perroItem.querySelector('.select-tamano');
    const selectedOption = selectServicio.options[selectServicio.selectedIndex];
    const tamanoId = parseInt(selectTamano.value);
    
    if (!selectedOption || !tamanoId) return;
    
    let precioBase = 0;
    if (tamanoId == 1) precioBase = parseFloat(selectedOption.getAttribute('data-pequeno') || 0);
    else if (tamanoId == 2) precioBase = parseFloat(selectedOption.getAttribute('data-mediano') || 0);
    else if (tamanoId == 3) precioBase = parseFloat(selectedOption.getAttribute('data-mediano-grande') || 0);
    else if (tamanoId == 4) precioBase = parseFloat(selectedOption.getAttribute('data-grande') || 0);
    else if (tamanoId == 5) precioBase = parseFloat(selectedOption.getAttribute('data-muy-grande') || 0);
    
    const checkboxes = perroItem.querySelectorAll('input[type="checkbox"]:checked');
    let precioAdicionales = 0;
    checkboxes.forEach(checkbox => {
        if (checkbox.value == '1') precioAdicionales += 5000; 
        if (checkbox.value == '2') precioAdicionales += 5000; 
    });
    
    const total = precioBase + precioAdicionales;
    
    const adicionalesValue = perroItem.querySelector('.adicionales-value');
    const totalValue = perroItem.querySelector('.total-value');
    
    if (adicionalesValue) adicionalesValue.textContent = '$' + precioAdicionales.toFixed(2);
    if (totalValue) totalValue.textContent = '$' + total.toFixed(2);
}

function agregarNuevoPerro() {
    if (contadorPerros >= 2) {
        alert('⚠️ Máximo 2 perros por turno');
        return;
    }

    const container = document.getElementById('perrosContainer');
    if (!container) {
        console.error(' No se encontró el contenedor de perros');
        return;
    }

    const nuevoPerro = document.createElement('div');
    nuevoPerro.className = 'perro-item';
    
    nuevoPerro.innerHTML = `
        <div class="perro-header">
            <span class="perro-numero"> Perro #${contadorPerros + 1}</span>
            <button type="button" class="btn-eliminar" onclick="eliminarPerro(this)">
                 Eliminar
            </button>
        </div>

        <div class="form-group">
            <label>Nombre del Perro *</label>
            <input type="text" name="perros[${contadorPerros}][nombre_perro]" required placeholder="Ej: Toby" class="perro-nombre">
        </div>

        <div class="form-group">
            <label>Tamaño del Perro *</label>
            <select name="perros[${contadorPerros}][id_tamano]" class="select-tamano" required>
                <option value="">Seleccione un tamaño</option>
                ${generarOpcionesTamano()}
            </select>
        </div>

        <div class="form-group">
            <label>Tipo de Servicio *</label>
            <select name="perros[${contadorPerros}][id_servicio]" class="select-servicio" required disabled>
                <option value="">Primero seleccione el tamaño</option>
            </select>
            <small class="help-text">Seleccione primero el tamaño del perro</small>
        </div>

        <div class="descripcion-servicio" style="display: none;">
            <strong> Este servicio incluye:</strong>
            <p class="texto-descripcion"></p>
        </div>

        <div class="adicionales-container">
            <div class="adicionales-title">➕ Adicionales (Opcional)</div>
            
            <div class="checkbox-item">
                <input type="checkbox" name="perros[${contadorPerros}][adicionales][]" value="1" id="adicional_1_${contadorPerros}">
                <label for="adicional_1_${contadorPerros}">
                     Corte de uñas 
                    <span class="checkbox-precio">(+$5000)</span>
                </label>
            </div>

            <div class="checkbox-item">
                <input type="checkbox" name="perros[${contadorPerros}][adicionales][]" value="2" id="adicional_2_${contadorPerros}">
                <label for="adicional_2_${contadorPerros}">
                    🚿 Sanitario 
                    <span class="checkbox-precio">(+$5000)</span>
                </label>
            </div>
        </div>

        <div class="info-box info-precio" style="display: none;">
            <div class="info-item">
                <span class="label"> Precio Base:</span>
                <span class="value precio-value">-</span>
            </div>
            <div class="info-item">
                <span class="label"> Adicionales:</span>
                <span class="value adicionales-value">$0</span>
            </div>
            <div class="info-item">
                <span class="label"> TOTAL:</span>
                <span class="value total-value" style="font-weight: bold; font-size: 18px;">-</span>
            </div>
        </div>

        <div class="form-group">
            <label>Comentarios sobre esta mascota (opcional)</label>
            <textarea name="perros[${contadorPerros}][comentarios]" rows="2" placeholder="Ej: Es nervioso, necesita bozal, etc."></textarea>
        </div>
    `;
    
    container.appendChild(nuevoPerro);
    inicializarEventosPerro(nuevoPerro);
    contadorPerros++;
    
    nuevoPerro.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    setTimeout(verificarDisponibilidadTurno, 100);
}

function eliminarPerro(btn) {
    const perroItem = btn.closest('.perro-item');
    const totalPerros = document.querySelectorAll('.perro-item').length;
    
    if (totalPerros <= 1) {
        alert(' Debe haber al menos un perro');
        return;
    }
    
    if (confirm('¿Está seguro de eliminar este perro del turno?')) {
        perroItem.remove();
        contadorPerros--;
        actualizarNumerosPerros();
        
        setTimeout(verificarDisponibilidadTurno, 100);
    }
}

function actualizarNumerosPerros() {
    const perros = document.querySelectorAll('.perro-item');
    perros.forEach((perro, index) => {
        const numero = perro.querySelector('.perro-numero');
        if (numero) {
            numero.textContent = ` Perro #${index + 1}`;
        }
    });
}

function generarOpcionesTamano() {
    const selectTamano = document.querySelector('.select-tamano');
    if (!selectTamano) return '';
    
    let html = '';
    for (let i = 1; i < selectTamano.options.length; i++) {
        const option = selectTamano.options[i];
        html += `<option value="${option.value}">${option.text}</option>`;
    }
    return html;
}

function configurarFecha() {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.min = hoy;
    }
}

async function procesarFormulario(e) {
    e.preventDefault();
    
    const perros = document.querySelectorAll('.perro-item');
    if (perros.length === 0) {
        alert('⚠️ Debe agregar al menos un perro');
        return false;
    }
    
    let todosCompletos = true;
    perros.forEach((perro, index) => {
        const nombrePerro = perro.querySelector('.perro-nombre');
        const tamano = perro.querySelector('.select-tamano');
        const servicio = perro.querySelector('.select-servicio');
        
        if (!nombrePerro || !nombrePerro.value || !tamano.value || !servicio.value) {
            alert(` Complete todos los datos del Perro #${index + 1}`);
            todosCompletos = false;
            return;
        }
    });
    
    if (!todosCompletos) return false;
    
    const nombreCliente = document.getElementById('nombre_cliente').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const descripcionGeneral = document.getElementById('descripcion_general').value.trim();
    
    if (!nombreCliente || !telefono || !fecha || !hora) {
        alert(' Complete todos los campos obligatorios');
        return false;
    }

    const submitBtn = document.getElementById('submitBtn');
    const textoOriginal = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Guardando turno...';
    
    try {
        const formData = new FormData(e.target);
        const response = await fetch('guardar.php', {
            method: 'POST',
            body: formData
        });
        
        const resultado = await response.json();
        
        if (resultado.error) {
            throw new Error(resultado.mensaje);
        }
        
        const mensaje = construirMensajeWhatsApp({
            nombreCliente,
            telefono,
            fecha,
            hora,
            descripcionGeneral,
            perros
        });
        
        enviarWhatsApp(mensaje);
        
        alert(`✅ ¡Turno reservado exitosamente!\n\n📅 Fecha: ${fecha}\n🕐 Hora: ${hora}\n💵 Total: $${resultado.total.toFixed(2)}\n\n📱 Ahora te redirigiremos a WhatsApp para confirmar.`);
        
        setTimeout(() => {
            window.location.href = 'index.php';
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al guardar el turno: ' + error.message + '\n\nPor favor intenta nuevamente.');
        submitBtn.disabled = false;
        submitBtn.textContent = textoOriginal;
    }
    
    return false;
}

function construirMensajeWhatsApp(datos) {
    const { nombreCliente, telefono, fecha, hora, descripcionGeneral, perros } = datos;

    const fechaObj = new Date(fecha + 'T00:00:00');
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const fechaFormateada = fechaObj.toLocaleDateString('es-AR', opciones);
    const horaFormateada = hora.substring(0, 5);

    let mensaje = ` *SOLICITUD DE TURNO - MUNDO CAN-CAN* 🐾\n\n`;
    mensaje += `═══════════════════════════\n\n`;
    mensaje += ` *DATOS DEL CLIENTE*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `Nombre: ${nombreCliente}\n`;
    mensaje += ` Teléfono: ${telefono}\n`;
    mensaje += `\n *FECHA Y HORARIO*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += ` Fecha: ${fechaFormateada}\n`;
    mensaje += ` Hora: ${horaFormateada}\n\n`;
 
    mensaje += ` *MASCOTAS ${perros.length}*\n`;
    mensaje += `═══════════════════════════\n\n`;
    
    let precioTotal = 0;
    
    perros.forEach((perro, index) => {
        const nombrePerro = perro.querySelector('.perro-nombre').value;
        const tamanoSelect = perro.querySelector('.select-tamano');
        const servicioSelect = perro.querySelector('.select-servicio');
        const comentarios = perro.querySelector('textarea').value;
        
        const tamanoTexto = tamanoSelect.options[tamanoSelect.selectedIndex].text;
        const servicioOption = servicioSelect.options[servicioSelect.selectedIndex];
        const servicioNombre = servicioOption.getAttribute('data-nombre');
        const tamanoId = parseInt(tamanoSelect.value);

        let precioBase = 0;
        if (tamanoId == 1) precioBase = parseFloat(servicioOption.getAttribute('data-pequeno'));
        else if (tamanoId == 2) precioBase = parseFloat(servicioOption.getAttribute('data-mediano'));
        else if (tamanoId == 3) precioBase = parseFloat(servicioOption.getAttribute('data-mediano-grande'));
        else if (tamanoId == 4) precioBase = parseFloat(servicioOption.getAttribute('data-grande'));
        else if (tamanoId == 5) precioBase = parseFloat(servicioOption.getAttribute('data-muy-grande'));

        const checkboxes = perro.querySelectorAll('input[type="checkbox"]:checked');
        let precioAdicionales = 0;
        let adicionalesTexto = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.value == '1') {
                precioAdicionales += 5000;
                adicionalesTexto.push('Corte de uñas $5000');
            }
            if (checkbox.value == '2') {
                precioAdicionales += 5000;
                adicionalesTexto.push('Sanitario $5000');
            }
        });
        
        const precioTotalPerro = precioBase + precioAdicionales;
        precioTotal += precioTotalPerro;
        
        mensaje += `*${index + 1}. ${nombrePerro.toUpperCase()}*\n`;
        mensaje += `     Tamaño: ${tamanoTexto}\n`;
        mensaje += `     Servicio: ${servicioNombre}\n`;
        mensaje += `     Precio base: $${precioBase.toFixed(2)}\n`;
        
        if (adicionalesTexto.length > 0) {
            mensaje += `    ➕ Adicionales:\n`;
            adicionalesTexto.forEach(ad => {
                mensaje += `      • ${ad}\n`;
            });
        }
        
        mensaje += `     Total: $${precioTotalPerro.toFixed(2)}\n`;
        
        if (comentarios) {
            mensaje += `     Observaciones: ${comentarios}\n`;
        }
        mensaje += `\n`;
    });

    mensaje += `═══════════════════════════\n`;
    mensaje += ` *TOTAL A PAGAR: $${precioTotal.toFixed(2)}*\n`;
    mensaje += `═══════════════════════════\n`;
    
    if (descripcionGeneral) {
        mensaje += `\n *COMENTARIOS GENERALES:*\n`;
        mensaje += `${descripcionGeneral}\n\n`;
    }
    
    mensaje += `\n *IMPORTANTE: Tu turno queda CONFIRMADO automáticamente con este mensaje. No es necesario esperar respuesta.*\n`;
    mensaje += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `_Enviado desde el sistema de reservas_\n`;
    mensaje += `_Mundo Can-Can _`;
    
    return mensaje;
}

function enviarWhatsApp(mensaje) {
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeCodificado}`;
    
    const ventana = window.open(urlWhatsApp, '_blank');
    
    if (!ventana) {
        alert(' Por favor habilite las ventanas emergentes para WhatsApp');
    }
}
