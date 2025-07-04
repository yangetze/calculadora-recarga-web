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
                diferencia: rentaActual
            };
        }

        // Ordenamos los montos de mayor a menor para una mejor aproximación
        montosRecarga.sort((a, b) => b - a);

        let mejorCombinacion = [];
        let mejorSuma = 0;
        let menorDiferencia = Number.MAX_VALUE; // Usamos Number.MAX_VALUE para representar infinito

        // Iteramos a través de todas las posibles combinaciones de recargas
        const numMontos = montosRecarga.length;
        // El bucle 2**numMontos genera todas las combinaciones de subconjuntos
        for (let i = 0; i < Math.pow(2, numMontos); i++) {
            let sumaActual = 0;
            let combinacionActual = [];
            for (let j = 0; j < numMontos; j++) {
                if ((i >> j) & 1) { // Operaciones de bits para generar combinaciones
                    sumaActual += montosRecarga[j];
                    combinacionActual.push(montosRecarga[j]);
                }
            }

            let diferencia = Math.abs(rentaActual - sumaActual);

            // Si encontramos una combinación que se acerca más
            if (diferencia < menorDiferencia) {
                menorDiferencia = diferencia;
                mejorSuma = sumaActual;
                mejorCombinacion = combinacionActual;
            } else if (diferencia === menorDiferencia) {
                // Si las diferencias son iguales, preferimos la que esté por encima (si es posible)
                // o la que sea más grande si ambas están por debajo
                if (sumaActual >= rentaActual && mejorSuma < rentaActual) { // Preferimos ir por encima si el actual lo hace y el mejor no
                     menorDiferencia = diferencia;
                     mejorSuma = sumaActual;
                     mejorCombinacion = combinacionActual;
                } else if (sumaActual < rentaActual && mejorSuma < rentaActual && sumaActual > mejorSuma) { // Si ambos están por debajo, preferimos el más grande
                     menorDiferencia = diferencia;
                     mejorSuma = sumaActual;
                     mejorCombinacion = combinacionActual;
                } else if (sumaActual >= rentaActual && mejorSuma >= rentaActual && sumaActual < mejorSuma) { // Si ambos están por encima, preferimos el más pequeño
                     menorDiferencia = diferencia;
                     mejorSuma = sumaActual;
                     mejorCombinacion = combinacionActual;
                }
            }
        }

        // Post-procesamiento: Si la mejor suma encontrada es aún menor que la renta,
        // intentamos añadir el monto más grande hasta superarla para asegurar cobertura.
        if (mejorSuma < rentaActual && montosRecarga.length > 0) {
            let sumaTemporal = mejorSuma;
            let combinacionTemporal = [...mejorCombinacion]; // Copia el array para no modificar el original directamente

            // Añadir el monto más grande hasta que la suma sea igual o mayor que la renta actual
            while (sumaTemporal < rentaActual) {
                sumaTemporal += montosRecarga[0]; // Siempre añade el monto más grande
                combinacionTemporal.push(montosRecarga[0]);
            }

            let diferenciaTemporal = Math.abs(rentaActual - sumaTemporal);
            if (diferenciaTemporal < menorDiferencia ||
                (diferenciaTemporal === menorDiferencia && sumaTemporal >= rentaActual && mejorSuma < rentaActual) || // Preferir ir por encima
                (diferenciaTemporal === menorDiferencia && sumaTemporal < rentaActual && sumaTemporal > mejorSuma) // Preferir el mayor si ambos están por debajo
            ) {
                menorDiferencia = diferenciaTemporal;
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
            
            // --- INICIO DE LA MODIFICACIÓN DE LA DIFERENCIA ---
            // Aseguramos que la diferencia se muestre siempre como un número positivo
            // e indicamos si es un sobrante (recarga > renta) o un faltante (recarga < renta).
            if (resultado.suma >= rentaActual) {
                // Si la suma es mayor o igual a la renta, es un sobrante.
                resultadosDiv.innerHTML += `<p class="success">Diferencia (sobrante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong></p>`;
            } else {
                // Si la suma es menor que la renta, es un faltante.
                resultadosDiv.innerHTML += `<p class="warning">Diferencia (faltante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong></p>`;
            }
            // --- FIN DE LA MODIFICACIÓN DE LA DIFERENCIA ---

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
