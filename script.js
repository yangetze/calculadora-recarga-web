document.addEventListener('DOMContentLoaded', () => {
    const rentaActualInput = document.getElementById('rentaActual');
    const montosRecargaInput = document.getElementById('montosRecarga');
    const calcularBtn = document.getElementById('calcularBtn');
    const resultadosDiv = document.getElementById('resultados');

    // Función principal para encontrar la recarga óptima
    function encontrarRecargaOptima(rentaActual, montosRecarga) {
        if (!montosRecarga || montosRecarga.length === 0) {
            return {
                seleccionados: [],
                suma: 0,
                diferencia: rentaActual // Si no hay montos, la diferencia es la renta completa
            };
        }

        // Ordenamos los montos de mayor a menor para ayudar en la selección greedy y el post-procesamiento
        montosRecarga.sort((a, b) => b - a);

        let mejorCombinacion = [];
        let mejorSuma = 0;
        // La "mejor" diferencia aquí es el valor absoluto, pero el criterio de selección es más complejo
        let menorDiferenciaAbsoluta = Number.MAX_VALUE; 

        // Variable para rastrear si ya encontramos una combinación que cubra la renta
        let mejorSumaCubreRenta = false; // true si mejorSuma >= rentaActual

        // Iteramos a través de todas las posibles combinaciones de recargas (subconjuntos)
        const numMontos = montosRecarga.length;
        for (let i = 0; i < Math.pow(2, numMontos); i++) {
            let sumaActual = 0;
            let combinacionActual = [];
            for (let j = 0; j < numMontos; j++) {
                if ((i >> j) & 1) { // Operaciones de bits para generar combinaciones
                    sumaActual += montosRecarga[j];
                    combinacionActual.push(montosRecarga[j]);
                }
            }

            let diferenciaActualAbs = Math.abs(rentaActual - sumaActual);
            let actualCubreRenta = (sumaActual >= rentaActual);

            // --- Lógica de Selección Mejorada ---
            // Si es la primera combinación encontrada
            if (mejorCombinacion.length === 0) {
                mejorSuma = sumaActual;
                mejorCombinacion = combinacionActual;
                menorDiferenciaAbsoluta = diferenciaActualAbs;
                mejorSumaCubreRenta = actualCubreRenta;
                continue; // Pasa a la siguiente iteración
            }

            // Caso 1: La suma actual cubre la renta
            if (actualCubreRenta) {
                if (mejorSumaCubreRenta) {
                    // Ambos cubren la renta: preferimos el que tenga menor sobrante
                    if (sumaActual < mejorSuma) { // Si la suma actual es menor (más cercana)
                        menorDiferenciaAbsoluta = diferenciaActualAbs;
                        mejorSuma = sumaActual;
                        mejorCombinacion = combinacionActual;
                    }
                } else {
                    // La suma actual cubre la renta, pero la mejor anterior NO: ¡Esta es preferible!
                    menorDiferenciaAbsoluta = diferenciaActualAbs;
                    mejorSuma = sumaActual;
                    mejorCombinacion = combinacionActual;
                    mejorSumaCubreRenta = true; // Actualiza el estado
                }
            } else {
                // Caso 2: La suma actual NO cubre la renta
                if (mejorSumaCubreRenta) {
                    // La mejor anterior SÍ cubre la renta: La actual (que no cubre) NO es mejor
                    // No hacemos nada, mantenemos la mejorSuma que cubre
                } else {
                    // Ambas NO cubren la renta: preferimos la que esté más cerca (más grande)
                    if (sumaActual > mejorSuma) { // Mayor suma significa menor "faltante"
                        menorDiferenciaAbsoluta = diferenciaActualAbs;
                        mejorSuma = sumaActual;
                        mejorCombinacion = combinacionActual;
                    }
                }
            }
        }

        // Post-procesamiento final: Si la renta aún no se cubrió (o incluso si se cubrió pero se puede optimizar),
        // intenta añadir el monto más grande para cubrirla o acercarse lo más posible
        // Este paso es crucial para asegurar que el faltante sea el mínimo o que se logre cubrir.
        // Solo aplica si el mejor resultado actual NO cubre la renta O si la diferencia es muy grande.
        if (mejorSuma < rentaActual && montosRecarga.length > 0) {
            let sumaTemporal = mejorSuma;
            let combinacionTemporal = [...mejorCombinacion]; // Copia el array

            // Añade el monto más grande repetidamente hasta que la suma cubra o supere la renta
            // o hasta que la siguiente adición haga la suma demasiado grande (alejarse mucho del objetivo si no se puede cubrir)
            let previousSumaTemporal = sumaTemporal;
            while (sumaTemporal < rentaActual) {
                sumaTemporal += montosRecarga[0]; // Agrega el monto más grande disponible
                combinacionTemporal.push(montosRecarga[0]);
                
                // Pequeña optimización para evitar sumar indefinidamente si es imposible cubrir
                // y ya estamos muy por encima de la mejor diferencia actual.
                if (Math.abs(rentaActual - sumaTemporal) > Math.abs(rentaActual - previousSumaTemporal) * 2 && previousSumaTemporal < rentaActual) {
                     break; 
                }
                previousSumaTemporal = sumaTemporal;
            }

            let diferenciaTemporalAbs = Math.abs(rentaActual - sumaTemporal);
            let temporalCubreRenta = (sumaTemporal >= rentaActual);

            // Comparamos esta nueva aproximación con la "mejorCombinacion" final de los subconjuntos
            if (temporalCubreRenta && !mejorSumaCubreRenta) {
                // Si la temporal cubre y la mejor no cubría, la temporal es mejor
                mejorSuma = sumaTemporal;
                mejorCombinacion = combinacionTemporal;
                menorDiferenciaAbsoluta = diferenciaTemporalAbs;
            } else if (temporalCubreRenta && mejorSumaCubreRenta && sumaTemporal < mejorSuma) {
                // Si ambas cubren, preferimos la que tenga menor sobrante
                mejorSuma = sumaTemporal;
                mejorCombinacion = combinacionTemporal;
                menorDiferenciaAbsoluta = diferenciaTemporalAbs;
            } else if (!temporalCubreRenta && !mejorSumaCubreRenta && sumaTemporal > mejorSuma) {
                // Si ninguna cubre, preferimos la que tenga menor faltante (mayor suma)
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
    function mostrarResultados(rentaActual, montosRecarga, resultado) {
        resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores

        // Mostrar la información de entrada
        resultadosDiv.innerHTML += `<p class="info">Tu renta actual es: <strong>${rentaActual.toFixed(2)} Bs.</strong></p>`;
        resultadosDiv.innerHTML += `<p class="info">Montos de recarga disponibles: <strong>${montosRecarga.map(m => m.toFixed(2)).join(', ')}</strong></p>`;

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
            
            // Mostrar la diferencia como un valor positivo, indicando si es un sobrante o faltante.
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
        
        // Parsear los montos de recarga del string a un array de números
        const montosTexto = montosRecargaInput.value;
        const montosRecarga = montosTexto.split(',')
                                        .map(monto => parseFloat(monto.trim()))
                                        .filter(monto => !isNaN(monto) && monto > 0); // Filtra los que no son números o son <= 0

        // Validaciones básicas
        if (isNaN(rentaActual) || rentaActual <= 0) {
            resultadosDiv.innerHTML = '<p class="error">Por favor, ingresa una renta actual válida (número positivo).</p>';
            return;
        }

        if (montosRecarga.length === 0) {
            resultadosDiv.innerHTML = '<p class="error">Por favor, ingresa al menos un monto de recarga válido.</p>';
            return;
        }

        // Llamar a la función de cálculo y mostrar resultados
        const resultado = encontrarRecargaOptima(rentaActual, montosRecarga);
        mostrarResultados(rentaActual, montosRecarga, resultado);
    });
});
