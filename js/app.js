// Centro de Doñana
const DONANA_CENTER = [37.02, -6.55];

// Mapa base
const map = L.map('map').setView(DONANA_CENTER, 9);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(map);

// Variable para almacenar la capa de límites
let limitesLayer = null;

// Mapeo de colores para los espacios protegidos según el campo 'name'
const espacioColorMap = {
  'PARQUE NACIONAL DE DOÑANA': '#f97316',
  'PARQUE NATURAL DE DOÑANA': '#6b7280',
  'CORREDOR VERDE DEL GUADIAMAR': '#166534'
};

// Color por defecto
const DEFAULT_ESPACIO_COLOR = '#888888';

// Mapeo de colores para los marcadores de impactos
const colorHexMap = {
  'rojo': '#e34234',
  'marron': '#8B4513',
  'azul': '#0288d1',
  'verde': '#2e7d32',
  'negro': '#37474f',
  'amarillo_naranja': '#f9a825',
  'morado': '#9c27b0'
};

// Mapeo de categorías para leyenda de impactos
const categoryColors = {
  fuego: '#e34234',
  fauna: '#8B4513',
  agua: '#0288d1',
  flora: '#2e7d32',
  industria: '#37474f',
  suelo: '#f9a825',
  recreativo: '#9c27b0'
};

// ============================================================
// FUNCIÓN PARA CARGAR LÍMITES DESDE GEOJSON LOCAL
// ============================================================
function cargarLimites() {
  fetch('data/limites.geojson')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      limitesLayer = L.geoJSON(data, {
        style: function(feature) {
          const nombre = feature.properties?.name || feature.properties?.NAME || '';
          const color = espacioColorMap[nombre] || DEFAULT_ESPACIO_COLOR;
          
          return {
            color: color,
            weight: 2.5,
            opacity: 0.8,
            fillColor: color,
            fillOpacity: 0.15,
            interactive: false
          };
        },
        onEachFeature: function(feature, layer) {
          layer.on({
            click: function(e) {
              L.DomEvent.stopPropagation(e);
            }
          });
        }
      }).addTo(map);
      
      limitesLayer.bringToBack();
      // console.log('✅ Límites cargados correctamente');
    })
    .catch(error => {
      console.error('❌ Error cargando límites:', error);
    });
}

// ============================================================
// FUNCIÓN PARA GENERAR SVG DE LAS FORMAS DE IMPACTOS
// ============================================================
function createShapeSvg(shape, colorHex, hasWhiteBorder = false) {
  const strokeWidth = hasWhiteBorder ? 2 : 0;
  const strokeColor = hasWhiteBorder ? 'white' : colorHex;
  const fillColor = colorHex;
  
  switch(shape) {
    case 'circle':
      return `<circle cx="10" cy="10" r="8" fill="${fillColor}" stroke="${fillColor}" stroke-width="0"/>`;
    
    case 'circle_2':
      return `<circle cx="10" cy="10" r="7" fill="${fillColor}" stroke="white" stroke-width="2"/>`;
    
    case 'square':
      return `<rect x="2" y="2" width="16" height="16" fill="${fillColor}" stroke="${fillColor}" stroke-width="0"/>`;
    
    case 'square_2':
      return `<rect x="2" y="2" width="14" height="14" fill="${fillColor}" stroke="white" stroke-width="2"/>`;
    
    case 'diamond':
      return `<polygon points="10,4 19,10 10,16 1,10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    
    case 'rombo':
      return `<polygon points="10,2 17,10 10,18 3,10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    
    case 'hexa':
      const cx = 10, cy = 10, r = 7.5;
      const points = [];
      for(let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return `<polygon points="${points.join(' ')}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    
    case 'triangle_up':
      return `<polygon points="10,2 2,16 18,16" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    
    case 'triangle_down':
      return `<polygon points="10,18 2,4 18,4" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    
    case 'cross':
      return `<g>
        <rect x="8" y="2" width="4" height="16" fill="${fillColor}"/>
        <rect x="2" y="8" width="16" height="4" fill="${fillColor}"/>
      </g>`;
    
    case 'x':
      return `<g>
        <line x1="2" y1="2" x2="18" y2="18" stroke="${fillColor}" stroke-width="3" stroke-linecap="round"/>
        <line x1="18" y1="2" x2="2" y2="18" stroke="${fillColor}" stroke-width="3" stroke-linecap="round"/>
      </g>`;
    
    case 'star':
      const outerR = 7.5, innerR = 3.2;
      const starPoints = [];
      for(let i = 0; i < 10; i++) {
        const angle = (i * 36 - 90) * Math.PI / 180;
        const r = (i % 2 === 0) ? outerR : innerR;
        const x = 10 + r * Math.cos(angle);
        const y = 10 + r * Math.sin(angle);
        starPoints.push(`${x},${y}`);
      }
      return `<polygon points="${starPoints.join(' ')}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    
    default:
      return `<circle cx="10" cy="10" r="8" fill="${fillColor}" stroke="${fillColor}" stroke-width="0"/>`;
  }
}

function createCustomIcon(colorName, shape, size = 20) {
  const colorHex = colorHexMap[colorName] || '#777';
  const hasWhiteBorder = (shape === 'square_2' || shape === 'circle_2');
  
  const svgContent = createShapeSvg(shape, colorHex, hasWhiteBorder);
  
  return L.divIcon({
    html: `<svg width="${size}" height="${size}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`,
    className: 'custom-svg-marker',
    iconSize: [size, size],
    popupAnchor: [0, -size/2]
  });
}

function createLegendIcon(colorName, shape, size = 18) {
  const colorHex = colorHexMap[colorName] || '#777';
  const hasWhiteBorder = (shape === 'square_2' || shape === 'circle_2');
  
  const svgContent = createShapeSvg(shape, colorHex, hasWhiteBorder);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style="display:block">${svgContent}</svg>`;
}

let impactosGeoJSON = null;
let markerCluster = L.markerClusterGroup();
let currentLayer = null;

// Cargar GeoJSON de impactos
fetch('data/impactos.geojson')
  .then(response => response.json())
  .then(data => {
    impactosGeoJSON = data;
    procesarYMostrar(data);
    poblarSelectCategorias(data);
    construirLeyendaImpactos(data);
  })
  .catch(error => console.error('Error cargando GeoJSON:', error));

function procesarYMostrar(data, filtroCategoria = 'all') {
  if (currentLayer) {
    map.removeLayer(currentLayer);
  }
  markerCluster.clearLayers();
  
  let count = 0;
  
  data.features.forEach(feature => {
    if (!feature.geometry || feature.geometry.type !== 'Point') return;
    
    const props = feature.properties;
    const categoria = props.categoria;
    const subCategoria = props.sub_categoria;
    const color = props.color;
    const shape = props.shape;
    const fuente = props.fuente;
    
    if (filtroCategoria !== 'all' && categoria !== filtroCategoria) return;
    
    count++;
    const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
    const icon = createCustomIcon(color, shape, 18);
    
    const marker = L.marker(coords, { icon: icon });
    
    const popupContent = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 250px;">
        <strong style="font-size: 1rem;">${subCategoria}</strong><br/>
        <span style="color: #555;">Categoría: ${categoria}</span><br/>
        <span style="color: #555;">Color: ${color} | Forma: ${shape}</span><br/>
        <span style="color: #777; font-size: 0.8rem;">Fuente: ${fuente}</span>
      </div>
    `;
    marker.bindPopup(popupContent);
    marker.featureData = { categoria, subCategoria, color, shape };
    markerCluster.addLayer(marker);
  });
  
  let countDiv = document.getElementById('resultCount');
  if (!countDiv) {
    countDiv = document.createElement('div');
    countDiv.id = 'resultCount';
    const sidebar = document.querySelector('#sidebar');
    if (sidebar) sidebar.appendChild(countDiv);
  }
  if (countDiv) countDiv.innerHTML = `📊 Mostrando ${count} impactos`;
  
  markerCluster.addTo(map);
  currentLayer = markerCluster;
  
  if (limitesLayer) {
    limitesLayer.bringToBack();
  }
}

function poblarSelectCategorias(data) {
  const categoriasSet = new Set();
  data.features.forEach(feature => {
    if (feature.properties && feature.properties.categoria) {
      categoriasSet.add(feature.properties.categoria);
    }
  });
  
  const categorias = Array.from(categoriasSet).sort();
  const select = document.getElementById('categoriaFilter');
  
  if (!select) return;
  
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    select.appendChild(option);
  });
}

function construirLeyendaImpactos(data) {
  const legendDiv = document.getElementById('legendImpactos');
  if (!legendDiv) return;
  
  legendDiv.innerHTML = '';
  
  const categoriasMap = new Map();
  
  data.features.forEach(feature => {
    if (!feature.properties) return;
    const props = feature.properties;
    const categoria = props.categoria;
    const color = props.color;
    const shape = props.shape;
    const subCategoria = props.sub_categoria;
    
    if (!categoriasMap.has(categoria)) {
      categoriasMap.set(categoria, new Map());
    }
    const shapeColorKey = `${shape}|${color}`;
    if (!categoriasMap.get(categoria).has(shapeColorKey)) {
      categoriasMap.get(categoria).set(shapeColorKey, { shape, color, ejemplo: subCategoria });
    }
  });
  
  for (let [categoria, shapesMap] of categoriasMap) {
    const catDiv = document.createElement('div');
    catDiv.style.marginBottom = '15px';
    catDiv.style.borderLeft = `3px solid ${categoryColors[categoria] || '#999'}`;
    catDiv.style.paddingLeft = '10px';
    
    const catTitle = document.createElement('div');
    catTitle.style.fontWeight = 'bold';
    catTitle.style.marginBottom = '8px';
    catTitle.style.fontSize = '0.9rem';
    catTitle.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    catDiv.appendChild(catTitle);
    
    for (let [key, { shape, color, ejemplo }] of shapesMap) {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.marginBottom = '6px';
      item.style.gap = '10px';
      
      const iconContainer = document.createElement('div');
      iconContainer.style.width = '22px';
      iconContainer.style.height = '22px';
      iconContainer.style.display = 'inline-flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      iconContainer.innerHTML = createLegendIcon(color, shape, 18);
      
      const label = document.createElement('span');
      label.textContent = ejemplo;
      label.style.fontSize = '0.75rem';
      label.style.flex = '1';
      
      item.appendChild(iconContainer);
      item.appendChild(label);
      catDiv.appendChild(item);
    }
    legendDiv.appendChild(catDiv);
  }
}

// Filtros
const filtrarBtn = document.getElementById('filtrarBtn');
if (filtrarBtn) {
  filtrarBtn.addEventListener('click', () => {
    const categoria = document.getElementById('categoriaFilter').value;
    if (impactosGeoJSON) {
      procesarYMostrar(impactosGeoJSON, categoria);
    }
  });
}

const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    const categoriaFilter = document.getElementById('categoriaFilter');
    if (categoriaFilter) categoriaFilter.value = 'all';
    if (impactosGeoJSON) {
      procesarYMostrar(impactosGeoJSON, 'all');
    }
  });
}

// Cargar los límites después de iniciar el mapa
cargarLimites();

map.on('zoomend', () => {});

// Toggle para móvil - Versión mejorada (cajón desde abajo)
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        // Cambiar texto del botón opcionalmente
        if (sidebar.classList.contains('open')) {
            sidebarToggle.textContent = '✕';
        } else {
            sidebarToggle.textContent = '☰';
        }
    });
    
    // Cerrar sidebar al hacer clic fuera en móvil
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('open');
            sidebarToggle.textContent = '☰';
        }
    });
    
    // Al hacer clic en enlaces, cerrar sidebar
    const links = sidebar.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                sidebarToggle.textContent = '☰';
            }
        });
    });
}