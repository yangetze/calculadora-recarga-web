if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
    const companiaTelefonicaSelect = document.getElementById('companiaTelefonica'); // Nuevo: Referencia a la lista desplegable
    const logoCompania = document.getElementById('logoCompania');
    const rentaActualInput = document.getElementById('rentaActual');
    const calcularBtn = document.getElementById('calcularBtn');
    const resultadosDiv = document.getElementById('resultados');
    const montosFijosDisplay = document.getElementById('montosFijosDisplay');

    // --- Montos de Recarga Fijos (¡Ahora es un objeto!) ---
    const montosRecargaPorCompania = {
        movistar: [250, 600, 1200, 2400, 3600, 6000, 9500, 15000],
        digitel: [300, 600, 900, 1800, 3000, 5400, 7500, 9000, 11000]
    };

    let montosRecargaActual = montosRecargaPorCompania.movistar; // Montos de recarga predeterminados

    // Función para dibujar los montos en la interfaz
    function dibujarMontos(montos) {
        montosFijosDisplay.innerHTML = '';
        montos.forEach(monto => {
            const span = document.createElement('span');
            span.classList.add('monto-tag');
            span.textContent = `${monto.toLocaleString('de-DE')} Bs.`;
            montosFijosDisplay.appendChild(span);
        });
    }

    // Llama a la función para dibujar los montos iniciales al cargar la página
    dibujarMontos(montosRecargaActual);

    // Make it available to the global scope for event listeners
    window.encontrarRecargaOptima = encontrarRecargaOptima;
    window.mostrarResultados = mostrarResultados;

    // Nuevo: Evento para detectar cambios en la lista desplegable
    companiaTelefonicaSelect.addEventListener('change', (event) => {
        const companiaSeleccionada = event.target.value;
        montosRecargaActual = montosRecargaPorCompania[companiaSeleccionada];

        // Actualizar logo
        if (companiaSeleccionada === 'movistar') {
            logoCompania.src = 'movistar-logo.svg';
            logoCompania.alt = 'Logo Movistar';
        } else if (companiaSeleccionada === 'digitel') {
            logoCompania.src = 'digitel-logo.svg';
            logoCompania.alt = 'Logo Digitel';
        }

        dibujarMontos(montosRecargaActual); // Dibuja los nuevos montos
        resultadosDiv.innerHTML = ''; // Opcional: Limpiar resultados anteriores para evitar confusiones
    });
    
    // Función para renderizar el contenido de una opción de recarga
    function crearContenidoOpcion(rentaActual, resultado, indexOpcion) {
        const container = document.createElement('div');
        container.classList.add('opcion-container');

        const successP = document.createElement('p');
        successP.classList.add('success');
        successP.textContent = 'La forma de recargar es seleccionando:';
        container.appendChild(successP);

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
        const montosUnicos = Object.keys(conteoMontos).map(Number).sort((a, b) => b - a);

        montosUnicos.forEach(monto => {
            const cantidad = conteoMontos[monto];
            const totalMonto = monto * cantidad;
            const li = document.createElement('li');
            li.textContent = `${monto.toFixed(2)} Bs. x ${cantidad} = ${totalMonto.toFixed(2)} Bs.`;
            ul.appendChild(li);
        });
        container.appendChild(ul);

        const totalP = document.createElement('p');
        totalP.classList.add('info');
        totalP.innerHTML = `Total a recargar: <strong>${resultado.suma.toFixed(2)} Bs.</strong>`;
        container.appendChild(totalP);

        const diffP = document.createElement('p');
        if (resultado.suma >= rentaActual) {
            diffP.classList.add('success');
            diffP.innerHTML = `Diferencia (sobrante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong>`;
        } else {
            diffP.classList.add('warning');
            diffP.innerHTML = `Diferencia (faltante): <strong>${resultado.diferencia.toFixed(2)} Bs.</strong>`;
        }
        container.appendChild(diffP);

        // Lógica de los checkboxes
        const trackerDiv = document.createElement('div');
        trackerDiv.classList.add('recharge-tracker');

        const titleH3 = document.createElement('h3');
        titleH3.textContent = 'Progreso de Recarga';
        trackerDiv.appendChild(titleH3);

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
            checkbox.id = `recharge-check-op${indexOpcion}-${index}`;
            checkbox.value = monto;

            const label = document.createElement('label');
            label.htmlFor = `recharge-check-op${indexOpcion}-${index}`;
            label.textContent = `${monto.toLocaleString('de-DE')} Bs.`;

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    currentRemaining -= monto;
                } else {
                    currentRemaining += monto;
                }

                if (currentRemaining < 0.01) currentRemaining = 0;

                if (currentRemaining === 0) {
                    remainingP.innerHTML = `<strong>¡Recarga completada!</strong>`;
                } else {
                    remainingP.innerHTML = `Falta por recargar: <strong>${currentRemaining.toFixed(2)} Bs.</strong>`;
                }

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
        container.appendChild(trackerDiv);

        if (resultado.suma < rentaActual) {
            const warningP = document.createElement('p');
            warningP.className = 'warning';
            warningP.textContent = 'Nota: La suma es menor que tu renta. Considera ajustar los montos disponibles o el monto de la renta para una mejor aproximación.';
            container.appendChild(warningP);
        }

        return container;
    }

    // Función para mostrar los resultados en la interfaz
    function mostrarResultados(rentaActual, resultados) {
        let htmlContent = `<p class="info">Tu renta actual es: <strong>${rentaActual.toFixed(2)} Bs.</strong></p>`;

        if (!resultados || resultados.length === 0) {
            htmlContent += `<p class="error">No se encontró una combinación de recargas que se ajuste a tu renta con los montos proporcionados.</p>`;
            resultadosDiv.innerHTML = htmlContent;
            return;
        }

        resultadosDiv.innerHTML = htmlContent;

        if (resultados.length === 1) {
            // Solo una opción, renderizar como antes
            const contenido = crearContenidoOpcion(rentaActual, resultados[0], 0);
            resultadosDiv.appendChild(contenido);
        } else {
            // Dos opciones, crear pestañas
            const tabsContainer = document.createElement('div');
            tabsContainer.classList.add('tabs-container');

            const tabsHeader = document.createElement('div');
            tabsHeader.classList.add('tabs-header');

            const tabsContent = document.createElement('div');
            tabsContent.classList.add('tabs-content');

            resultados.forEach((resultado, index) => {
                // Tab Button
                const tabButton = document.createElement('button');
                tabButton.classList.add('tab-button');
                if (index === 0) {
                    tabButton.classList.add('active');
                    tabButton.textContent = `Opción 1: Menor Monto (${resultado.suma.toFixed(2)} Bs.)`;
                } else {
                    tabButton.textContent = `Opción 2: Menos Recargas (${resultado.suma.toFixed(2)} Bs.)`;
                }

                // Tab Content Panel
                const tabPanel = document.createElement('div');
                tabPanel.classList.add('tab-panel');
                if (index === 0) {
                    tabPanel.classList.add('active');
                }
                const contenido = crearContenidoOpcion(rentaActual, resultado, index);
                tabPanel.appendChild(contenido);

                // Event listener para cambiar pestaña
                tabButton.addEventListener('click', () => {
                    // Desactivar todos los botones y paneles
                    tabsHeader.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    tabsContent.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

                    // Activar el botón y panel clickeado
                    tabButton.classList.add('active');
                    tabPanel.classList.add('active');
                });

                tabsHeader.appendChild(tabButton);
                tabsContent.appendChild(tabPanel);
            });

            tabsContainer.appendChild(tabsHeader);
            tabsContainer.appendChild(tabsContent);
            resultadosDiv.appendChild(tabsContainer);
        }
    }

    // Event listener para el botón de cálculo
    calcularBtn.addEventListener('click', () => {
        const rentaActual = parseFloat(rentaActualInput.value);
        const montosRecarga = montosRecargaActual;

        if (isNaN(rentaActual) || rentaActual <= 0 || rentaActual > 100000) {
            resultadosDiv.innerHTML = '<p class="error">Por favor, ingresa una renta actual válida (número positivo entre 0.01 y 100,000).</p>';
            return;
        }
        if (montosRecarga.length === 0) {
            resultadosDiv.innerHTML = '<p class="error">Error interno: No hay montos de recarga definidos para esta compañía.</p>';
            return;
        }

        const resultados = encontrarRecargaOptima(rentaActual, montosRecarga);
        mostrarResultados(rentaActual, resultados);
    });
    });
}

/**
 * Función principal para encontrar la recarga óptima
 * @param {number} rentaActual - El monto de la renta a cubrir
 * @param {number[]} montosRecarga - Lista de montos de recarga permitidos
 * @returns {Object[]} Lista de opciones de recarga encontradas
 */
function encontrarRecargaOptima(rentaActual, montosRecarga) {
    if (!montosRecarga || montosRecarga.length === 0) {
        return [];
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

    // Recopilamos todas las sumas válidas >= target
    const results = [];
    for (let s = target; s <= limitInt; s++) {
        if (dpCount[s] !== INF) {
            results.push({ sumInt: s, numRecargas: dpCount[s] });
        }
    }

    if (results.length === 0) {
         return [];
    }

    // Opción 1: Menor diferencia de dinero (primera en la lista, porque iteramos hacia arriba)
    const opcion1 = results[0];

    // Opción 2: Menor cantidad de recargas, límite +20%
    const margenPorcentaje = 0.20;
    const limiteSumaOpcion2 = opcion1.sumInt * (1 + margenPorcentaje);
    let opcion2 = null;

    for (let i = 1; i < results.length; i++) {
        const r = results[i];
        if (r.sumInt > limiteSumaOpcion2) {
            break; // Ya nos pasamos del 20%
        }
        if (r.numRecargas < opcion1.numRecargas) {
            opcion2 = r;
            break; // Tomamos la PRIMERA que reduzca las recargas
        }
    }

    const opcionesFinales = [opcion1];
    if (opcion2) {
        opcionesFinales.push(opcion2);
    }

    // Reconstruir los montos para cada opción
    return opcionesFinales.map(op => {
        const resultMontos = [];
        let curr = op.sumInt;
        while (curr > 0) {
            let m = dpLastMonto[curr];
            resultMontos.push(m / scale);
            curr -= m;
        }
        resultMontos.sort((a, b) => b - a);
        return {
            seleccionados: resultMontos,
            suma: op.sumInt / scale,
            diferencia: Math.abs((op.sumInt / scale) - rentaActual)
        };
    });
}

// Node.js export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { encontrarRecargaOptima };
}
