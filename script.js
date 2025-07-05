document.addEventListener('DOMContentLoaded', () => {
    const rentaActualInput = document.getElementById('rentaActual');
    const calcularBtn = document.getElementById('calcularBtn');
    const resultadosDiv = document.getElementById('resultados');
    const montosFijosDisplay = document.getElementById('montosFijosDisplay'); // Nuevo: Referencia al div donde se mostrarán los montos

    // --- Montos de Recarga Fijos (¡Puedes modificar este array!) ---
    const montosRecargaFijos = [90, 200, 300, 450, 650, 1000, 1500, 2700];

    // Función para dibujar los montos fijos en la interfaz
    function dibujarMontosFijos() {
        montosFijosDisplay.innerHTML = ''; // Limpiar cualquier contenido previo
        montosRecargaFijos.forEach(monto => {
            const span = document.createElement('span');
            span.classList.add('monto-tag'); // Añadir la clase CSS para el estilo
            span.textContent = `${monto.toFixed(2)} Bs.`;
            montosFijosDisplay.appendChild(span);
        });
    }

    // Llama a la función para dibujar los montos al cargar la página
    dibujarMontosFijos();

    // Función principal para encontrar la recarga óptima
    function encontrarRecargaOptima(rentaActual, montosRecarga) {
        if (!montosRecarga || montosRecarga.length === 0) {
            return {
                seleccionados: [],
                suma: 0,
                diferencia: rentaActual
            };
        }

        montosRecarga.sort((a, b) => b - a); // Ordenamos los montos de mayor a menor

        let mejorCombinacion = [];
        let mejorSuma = 0;
        let menorDiferenciaAbsoluta = Number.MAX_VALUE;
        let mejorSumaCubreRenta = false; // true si mejorSuma >= rentaActual

        const numMontos = montosRecarga.length;
        for (let i = 0; i < Math.pow(2, numMontos); i++) {
            let sumaActual = 0;
            let combinacionActual = [];
            for (let j = 0; j < numMontos; j++) {
                if ((i >> j) & 1) {
                    sumaActual += montosRecarga[j];
                    combinacionActual.push(montosRecarga[j]);
                }
            }

            let diferenciaActualAbs = Math.abs(rentaActual - sumaActual);
            let actualCubreRenta = (sumaActual >= rentaActual);

            if (mejorCombinacion.length === 0) {
                mejorSuma = sumaActual;
                mejorCombinacion = combinacionActual;
                menorDiferenciaAbsoluta = diferenciaActualAbs;
                mejorSumaCubreRenta = actualCubreRenta;
                continue;
            }

            if (actualCubreRenta) {
                if (mejorSumaCubreRenta) {
                    if (sumaActual < mejorSuma) { // Menor sobrante
                        menorDiferenciaAbsoluta = diferenciaActualAbs;
                        mejorSuma = sumaActual;
                        mejorCombinacion = combinacionActual;
                    }
                } else { // Actual cubre, mejor anterior no
                    menorDiferenciaAbsoluta = diferenciaActualAbs;
                    mejorSuma = sumaActual;
                    mejorCombinacion = combinacionActual;
                    mejorSumaCubreRenta = true;
                }
            } else { // Actual no cubre
                if (mejorSumaCubreRenta) {
                    // Mejor anterior cubre, actual no. Mantenemos la mejor anterior.
                } else { // Ambas no cubren
                    if (sumaActual > mejorSuma) { // Mayor suma (menor faltante)
                        menorDiferenciaAbsoluta = diferenciaActualAbs;
                        mejorSuma = sumaActual;
                        mejorCombinacion = combinacionActual;
                    }
                }
            }
        }

        // Post-procesamiento final (intenta cubrir la renta con el monto más grande si es necesario)
        if (mejorSuma < rentaActual && montosRecarga.length > 0) {
            let sumaTemporal = mejorSuma;
            let combinacionTemporal = [...mejorCombinacion];

            let previousSumaTemporal = sumaTemporal;
            while (sumaTemporal < rentaActual) {
                sumaTemporal += montosRecarga[0];
                combinacionTemporal.push(montosRecarga[0]);
                
                if (Math.abs(rentaActual - sumaTemporal) > Math.abs(rentaActual - previousSumaTemporal) * 2 && previousSumaTemporal < rentaActual) {
                     break; 
                }
                previousSumaTemporal = sumaTemporal;
            }

            let diferenciaTemporalAbs = Math.abs(rentaActual - sumaTemporal);
            let temporalCubreRenta = (sumaTemporal >= rentaActual);

            if (temporalCubreRenta && !mejorSumaCubreRenta) {
                mejorSuma = sumaTemporal;
                mejorCombinacion = combinacionTemporal;
                menorDiferenciaAbsoluta = diferenciaTemporalAbs;
            } else if (temporalCubreRenta && mejorSumaCubreRenta && sumaTemporal < mejorSuma) {
                mejorSuma = sumaTemporal;
                mejorCombinacion = combinacionTemporal;
                menorDiferenciaAbsoluta = diferenciaTemporalAbs;
            } else if (!temporalCubreRenta && !mejorSumaCubreRenta && sumaTemporal > mejorSuma) {
                mejorSuma = sumaTemporal;
                mejorCombinacion = combinacionTemporal;
                menorDiferenciaAbsoluta = diferenciaTemporalAbs;
            }
        }

        return {
            seleccionados: mejorCombinacion,
            suma: mejorSuma,
            diferencia: menorDiferenciaAbsoluta
        };
    }

    // Función para mostrar los resultados en la interfaz
    function mostrarResultados(rentaActual, resultado) { // Ya no necesitamos montosRecarga como argumento aquí
        resultadosDiv.innerHTML = '';

        resultadosDiv.innerHTML += `<p class="info">Tu renta actual es: <strong>${rentaActual.toFixed(2)} Bs.</strong></p>`;
        // Ya no necesitamos mostrar los montos disponibles aquí, ya que son fijos y se muestran arriba.

        if (resultado.seleccionados.length > 0) {
            resultadosDiv.innerHTML += `<p class="success">La forma **más óptima** de recargar es seleccionando:</p>`;
            const ul = document.createElement('ul');
            resultado.seleccionados.forEach(monto => {
                const li = document.createElement('li');
                li.textContent = `${monto.toFixed(2)} Bs.`;
                ul.appendChild(li);
            });
            resultadosDiv.appendChild(ul);

            resultadosDiv.innerHTML += `<p class="info">Suma Total Recargada: <strong>${resultado.suma.toFixed(2)} Bs.</strong></p>`;
            
            if (resultado.suma >= rentaActual) {
                resultadosDiv.innerHTML += `<p class="success">Diferencia (sobrante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong></p>`;
            } else {
                resultadosDiv.innerHTML += `<p class="warning">Diferencia (faltante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong></p>`;
            }

            if (resultado.suma < rentaActual) {
                resultadosDiv.innerHTML += `<p class="warning">**Nota:** La suma es menor que tu renta. Considera ajustar los montos disponibles o el monto de la renta para una mejor aproximación.</p>`;
            } else {
                resultadosDiv.innerHTML += `<p class="success">¡Recarga calculada con éxito!</p>`;
            }

        } else {
            resultadosDiv.innerHTML += `<p class="error">No se encontró una combinación de recargas que se ajuste a tu renta con los montos proporcionados.</p>`;
        }
    }

    // Event listener para el botón de cálculo
    calcularBtn.addEventListener('click', () => {
        const rentaActual = parseFloat(rentaActualInput.value);
        
        // ¡Ahora usamos el array fijo!
        const montosRecarga = montosRecargaFijos;

        // Validaciones básicas
        if (isNaN(rentaActual) || rentaActual <= 0) {
            resultadosDiv.innerHTML = '<p class="error">Por favor, ingresa una renta actual válida (número positivo).</p>';
            return;
        }

        if (montosRecarga.length === 0) {
            resultadosDiv.innerHTML = '<p class="error">Error interno: No hay montos de recarga definidos.</p>'; // Mensaje más específico
            return;
        }

        // Llamar a la función de cálculo y mostrar resultados
        const resultado = encontrarRecargaOptima(rentaActual, montosRecarga);
        mostrarResultados(rentaActual, resultado); // Ya no pasamos montosRecarga como argumento, solo resultado
    });
});
