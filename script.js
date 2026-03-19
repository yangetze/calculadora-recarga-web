document.addEventListener('DOMContentLoaded', () => {
    const companiaTelefonicaSelect = document.getElementById('companiaTelefonica'); // Nuevo: Referencia a la lista desplegable
    const rentaActualInput = document.getElementById('rentaActual');
    const calcularBtn = document.getElementById('calcularBtn');
    const resultadosDiv = document.getElementById('resultados');
    const montosFijosDisplay = document.getElementById('montosFijosDisplay');

    // --- Montos de Recarga Fijos (¡Ahora es un objeto!) ---
    const montosRecargaPorCompania = {
        movistar: [150, 200, 1000, 2000, 3000, 5000, 8000, 10000],
        digitel: [300, 600, 900, 1800, 3000, 5400, 7500, 9000, 11000]
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

        // --- Algoritmo de Knapsack (Cambio de Monedas) ---
        // Objetivo: Encontrar la combinación que sume >= rentaActual
        // Criterio 1: Minimizar (Suma - RentaActual)
        // Criterio 2: Minimizar el número de elementos (recargas)

        const scale = 100;
        const target = Math.ceil(rentaActual * scale);
        const montosInt = montosRecarga.map(m => Math.round(m * scale));
        const maxMontoInt = Math.max(...montosInt);

        // Limite de búsqueda: Si tenemos una suma >= target + maxMonto,
        // podríamos haber quitado el monto máximo y estaríamos más cerca del target (o aún válidos).
        // Por seguridad y simplicidad, buscamos hasta target + maxMonto.
        const limitInt = target + maxMontoInt;

        // dpCount[s] almacena el número mínimo de monedas para llegar a la suma 's'.
        // Inicializamos con un valor grande.
        const INF = 2147483647;
        const dpCount = new Int32Array(limitInt + 1).fill(INF);
        // dpLastMonto[s] almacena el último monto agregado para llegar a 's' (para reconstruir).
        const dpLastMonto = new Int32Array(limitInt + 1).fill(0);

        dpCount[0] = 0;

        // Llenamos la tabla DP
        for (let monto of montosInt) {
            for (let s = monto; s <= limitInt; s++) {
                if (dpCount[s - monto] !== INF) {
                    if (dpCount[s - monto] + 1 < dpCount[s]) {
                        dpCount[s] = dpCount[s - monto] + 1;
                        dpLastMonto[s] = monto;
                    }
                }
            }
        }

        // Buscamos la mejor suma >= target
        let bestSum = -1;

        for (let s = target; s <= limitInt; s++) {
            if (dpCount[s] !== INF) {
                bestSum = s;
                // Como iteramos desde target hacia arriba, el primer 's' válido
                // es el que minimiza la diferencia (Suma - Renta).
                // Al usar DP para min monedas, garantizamos min recargas para esa suma.
                break;
            }
        }

        if (bestSum === -1) {
             // Caso extremo: no se encontró solución (raro si hay montos)
             // Esto podría pasar si el target es muy grande y limitamos el array
             // pero aquí el array es dinámico basado en target.
             return {
                seleccionados: [],
                suma: 0,
                diferencia: rentaActual
             };
        }

        // Reconstruimos la solución
        const resultMontos = [];
        let curr = bestSum;
        while (curr > 0) {
            let m = dpLastMonto[curr];
            resultMontos.push(m / scale);
            curr -= m;
        }

        // Ordenamos para mejor presentación (mayor a menor)
        resultMontos.sort((a, b) => b - a);

        return {
            seleccionados: resultMontos,
            suma: bestSum / scale,
            diferencia: Math.abs((bestSum / scale) - rentaActual)
        };
    }

    // Función para mostrar los resultados en la interfaz
    function mostrarResultados(rentaActual, resultado) {
        resultadosDiv.innerHTML = '';
        resultadosDiv.innerHTML += `<p class="info">Tu renta actual es: <strong>${rentaActual.toFixed(2)} Bs.</strong></p>`;
        
        if (resultado.seleccionados.length > 0) {
            resultadosDiv.innerHTML += `<p class="success">La forma más óptima de recargar es seleccionando:</p>`;

            // Agrupar los montos
            const conteoMontos = {};
            resultado.seleccionados.forEach(monto => {
                if (conteoMontos[monto]) {
                    conteoMontos[monto]++;
                } else {
                    conteoMontos[monto] = 1;
                }
            });

            const ul = document.createElement('ul');
            // Ordenar los montos de mayor a menor para la vista agrupada
            const montosUnicos = Object.keys(conteoMontos).map(Number).sort((a, b) => b - a);

            montosUnicos.forEach(monto => {
                const cantidad = conteoMontos[monto];
                const totalMonto = monto * cantidad;
                const li = document.createElement('li');
                li.textContent = `${monto.toFixed(2)} Bs. x ${cantidad} = ${totalMonto.toFixed(2)} Bs.`;
                ul.appendChild(li);
            });
            resultadosDiv.appendChild(ul);

            resultadosDiv.innerHTML += `<p class="info">Suma Total Recargada: <strong>${resultado.suma.toFixed(2)} Bs.</strong></p>`;

            // Lógica de los checkboxes
            const trackerDiv = document.createElement('div');
            trackerDiv.classList.add('recharge-tracker');

            trackerDiv.innerHTML += `<h3>Progreso de Recarga</h3>`;

            const remainingP = document.createElement('p');
            remainingP.classList.add('remaining-amount');
            remainingP.innerHTML = `Falta por recargar: <strong>${resultado.suma.toFixed(2)} Bs.</strong>`;
            trackerDiv.appendChild(remainingP);

            const checklistUl = document.createElement('ul');
            checklistUl.classList.add('checklist');

            let currentRemaining = resultado.suma;

            resultado.seleccionados.forEach((monto, index) => {
                const li = document.createElement('li');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `recharge-check-${index}`;
                checkbox.value = monto;

                const label = document.createElement('label');
                label.htmlFor = `recharge-check-${index}`;
                label.textContent = `${monto.toFixed(2)} Bs.`;

                // Add event listener to update remaining amount
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        currentRemaining -= monto;
                    } else {
                        currentRemaining += monto;
                    }

                    // Prevent floating point errors
                    if (currentRemaining < 0.01) currentRemaining = 0;

                    remainingP.innerHTML = `Falta por recargar: <strong>${currentRemaining.toFixed(2)} Bs.</strong>`;

                    if (e.target.checked) {
                        li.classList.add('checked');
                    } else {
                        li.classList.remove('checked');
                    }
                });

                li.appendChild(checkbox);
                li.appendChild(label);
                checklistUl.appendChild(li);
            });

            trackerDiv.appendChild(checklistUl);
            resultadosDiv.appendChild(trackerDiv);

            
            if (resultado.suma >= rentaActual) {
                resultadosDiv.innerHTML += `<p class="success">Diferencia (sobrante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong></p>`;
            } else {
                resultadosDiv.innerHTML += `<p class="warning">Diferencia (faltante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong></p>`;
            }

            if (resultado.suma < rentaActual) {
                resultadosDiv.innerHTML += `<p class="warning">Nota: La suma es menor que tu renta. Considera ajustar los montos disponibles o el monto de la renta para una mejor aproximación.</p>`;
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
