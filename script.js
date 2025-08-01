document.addEventListener('DOMContentLoaded', () => {
    const companiaTelefonicaSelect = document.getElementById('companiaTelefonica'); // Nuevo: Referencia a la lista desplegable
    const rentaActualInput = document.getElementById('rentaActual');
    const calcularBtn = document.getElementById('calcularBtn');
    const resultadosDiv = document.getElementById('resultados');
    const montosFijosDisplay = document.getElementById('montosFijosDisplay');

    // --- Montos de Recarga Fijos (¡Ahora es un objeto!) ---
    const montosRecargaPorCompania = {
        movistar: [100,200,500,800,1500,1800,3000,5000],
        digitel: [120,240,360,720,1200,1440,2800,3800] 
    };

    let montosRecargaActual = montosRecargaPorCompania.movistar; // Montos de recarga predeterminados

    // Función para dibujar los montos en la interfaz
    function dibujarMontos(montos) {
        montosFijosDisplay.innerHTML = '';
        montos.forEach(monto => {
            const span = document.createElement('span');
            span.classList.add('monto-tag');
            span.textContent = `${monto.toFixed(2)} Bs.`;
            montosFijosDisplay.appendChild(span);
        });
    }

    // Llama a la función para dibujar los montos iniciales al cargar la página
    dibujarMontos(montosRecargaActual);

    // Nuevo: Evento para detectar cambios en la lista desplegable
    companiaTelefonicaSelect.addEventListener('change', (event) => {
        const companiaSeleccionada = event.target.value;
        montosRecargaActual = montosRecargaPorCompania[companiaSeleccionada];
        dibujarMontos(montosRecargaActual); // Dibuja los nuevos montos
        resultadosDiv.innerHTML = ''; // Opcional: Limpiar resultados anteriores para evitar confusiones
    });
    
    // Función principal para encontrar la recarga óptima
    function encontrarRecargaOptima(rentaActual, montosRecarga) {
        if (!montosRecarga || montosRecarga.length === 0) {
            return {
                seleccionados: [],
                suma: 0,
                diferencia: rentaActual
            };
        }

        montosRecarga.sort((a, b) => b - a);

        let mejorCombinacion = [];
        let mejorSuma = 0;
        let menorDiferenciaAbsoluta = Number.MAX_VALUE;
        let mejorSumaCubreRenta = false;

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
                    if (sumaActual < mejorSuma) {
                        menorDiferenciaAbsoluta = diferenciaActualAbs;
                        mejorSuma = sumaActual;
                        mejorCombinacion = combinacionActual;
                    }
                } else {
                    menorDiferenciaAbsoluta = diferenciaActualAbs;
                    mejorSuma = sumaActual;
                    mejorCombinacion = combinacionActual;
                    mejorSumaCubreRenta = true;
                }
            } else {
                if (mejorSumaCubreRenta) {
                    // No hacemos nada
                } else {
                    if (sumaActual > mejorSuma) {
                        menorDiferenciaAbsoluta = diferenciaActualAbs;
                        mejorSuma = sumaActual;
                        mejorCombinacion = combinacionActual;
                    }
                }
            }
        }

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
    function mostrarResultados(rentaActual, resultado) {
        resultadosDiv.innerHTML = '';
        resultadosDiv.innerHTML += `<p class="info">Tu renta actual es: <strong>${rentaActual.toFixed(2)} Bs.</strong></p>`;
        
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
        const montosRecarga = montosRecargaActual; // ¡Usamos la variable que se actualiza!

        if (isNaN(rentaActual) || rentaActual <= 0) {
            resultadosDiv.innerHTML = '<p class="error">Por favor, ingresa una renta actual válida (número positivo).</p>';
            return;
        }
        if (montosRecarga.length === 0) {
            resultadosDiv.innerHTML = '<p class="error">Error interno: No hay montos de recarga definidos para esta compañía.</p>';
            return;
        }

        const resultado = encontrarRecargaOptima(rentaActual, montosRecarga);
        mostrarResultados(rentaActual, resultado);
    });
});
