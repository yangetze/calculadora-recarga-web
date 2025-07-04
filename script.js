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

        // Ordenamos los montos de mayor a menor para una mejor aproximación inicial
        montosRecarga.sort((a, b) => b - a);

        let mejorCombinacion = [];
        let mejorSuma = 0;
        let menorDiferencia = Number.MAX_VALUE; // Inicializamos con una diferencia muy grande

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

            // Criterios de selección para la "mejor" combinación:
            // 1. Si la diferencia absoluta actual es menor que la mejor encontrada hasta ahora.
            // 2. Si las diferencias absolutas son iguales:
            //    a. Preferimos una suma que sea igual o mayor que la renta (cubriéndola).
            //    b. Si ambas suman menos que la renta, preferimos la más grande (más cercana por debajo).
            //    c. Si ambas suman más que la renta, preferimos la más pequeña (más cercana por encima).
            if (diferenciaActualAbs < menorDiferencia) {
                menorDiferencia = diferenciaActualAbs;
                mejorSuma = sumaActual;
                mejorCombinacion = combinacionActual;
            } else if (diferenciaActualAbs === menorDiferencia) {
                // Caso de empate en la diferencia absoluta
                if (sumaActual >= rentaActual && mejorSuma < rentaActual) {
                    // Si la suma actual cubre la renta y la mejor anterior no, la actual es preferible
                    menorDiferencia = diferenciaActualAbs;
                    mejorSuma = sumaActual;
                    mejorCombinacion = combinacionActual;
                } else if (sumaActual < rentaActual && mejorSuma < rentaActual && sumaActual > mejorSuma) {
                    // Si ambas son menores que la renta, preferimos la más grande (más cerca por debajo)
                    menorDiferencia = diferenciaActualAbs;
                    mejorSuma = sumaActual;
                    mejorCombinacion = combinacionActual;
                } else if (sumaActual >= rentaActual && mejorSuma >= rentaActual && sumaActual < mejorSuma) {
                    // Si ambas son mayores que la renta, preferimos la más pequeña (más cerca por encima)
                    menorDiferencia = diferenciaActualAbs;
                    mejorSuma = sumaActual;
                    mejorCombinacion = combinacionActual;
                }
            }
        }

        // Post-procesamiento adicional: Asegurar que si la renta no se cubrió,
        // intentamos agregar el monto más grande para cubrirla o acercarse lo más posible
        // siempre y cuando esto mejore la diferencia final.
        // Este paso es crucial si la renta es muy alta y no se puede cubrir con una sola combinación simple.
        if (mejorSuma < rentaActual && montosRecarga.length > 0) {
            let sumaTemporal = mejorSuma;
            let combinacionTemporal = [...mejorCombinacion]; // Copia el array

            // Añade el monto más grande repetidamente hasta que la suma cubra o supere la renta
            while (sumaTemporal < rentaActual) {
                sumaTemporal += montosRecarga[0]; // Agrega el monto más grande disponible
                combinacionTemporal.push(montosRecarga[0]);
            }

            let diferenciaTemporalAbs = Math.abs(rentaActual - sumaTemporal);

            // Comparamos esta nueva aproximación con la "mejorCombinacion" anterior
            if (diferenciaTemporalAbs < menorDiferencia ||
                (diferenciaTemporalAbs === menorDiferencia && sumaTemporal >= rentaActual && mejorSuma < rentaActual) ||
                (diferenciaTemporalAbs === menorDiferencia && sumaTemporal >= rentaActual && mejorSuma >= rentaActual && sumaTemporal < mejorSuma) ||
                (diferenciaTemporalAbs === menorDiferencia && sumaTemporal < rentaActual && mejorSuma < rentaActual && sumaTemporal > mejorSuma)
            ) {
                menorDiferencia = diferenciaTemporalAbs;
                mejorSuma = sumaTemporal;
                mejorCombinacion = combinacionTemporal;
            }
        }

        return {
            seleccionados: mejorCombinacion,
            suma: mejorSuma,
            diferencia: menorDiferencia
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
