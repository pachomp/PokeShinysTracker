// script.js

const regions = {
  kanto: { id: 1, offset: 0, limit: 151 },
  johto: { id: 2, offset: 151, limit: 100 },
  hoenn: { id: 3, offset: 251, limit: 135 },
  sinnoh: { id: 4, offset: 386, limit: 107 },
  unova: { id: 5, offset: 493, limit: 156 },
  kalos: { id: 6, offset: 649, limit: 72 },
  alola: { id: 7, offset: 721, limit: 88 },
  galar: { id: 8, offset: 809, limit: 96 },
  paldea: { id: 9, offset: 905, limit: 103 },
  otros: { id: 10, offset: 1000, limit: 50 } // Ajustar según sea necesario
};

// Modificación en loadRegion para contar los checkboxes marcados y actualizar el título
async function loadRegion(region, listId) {
  const regionData = regions[region];
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${regionData.offset}&limit=${regionData.limit}`);
  const data = await response.json();
  const listElement = document.getElementById(listId);

  listElement.innerHTML = ''; // Limpiar el contenido anterior

  const pokemonList = await Promise.all(data.results.map(pokemon => fetchPokemonData(pokemon.name)));
  pokemonList.sort((a, b) => a.id - b.id);

  let checkedCount = 0;

  pokemonList.forEach(pokemonData => {
    const listItem = document.createElement('li');
    listItem.setAttribute('data-name', pokemonData.nameEs.toLowerCase());

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `shiny-${region}-${pokemonData.id}`;
    checkbox.name = `shiny-${region}-${pokemonData.id}`;
    checkbox.value = pokemonData.name;
    checkbox.checked = localStorage.getItem(checkbox.id) === 'true';

    if (checkbox.checked) {
      checkedCount++;
    }

    const img = document.createElement('img');
    img.src = checkbox.checked ? pokemonData.sprites.front_shiny : pokemonData.sprites.front_default;
    img.alt = pokemonData.name;
    img.classList.add('pokemon-image');

    checkbox.addEventListener('change', function() {
      localStorage.setItem(checkbox.id, checkbox.checked);
      listItem.classList.toggle('checked', checkbox.checked);
      img.src = checkbox.checked ? pokemonData.sprites.front_shiny : pokemonData.sprites.front_default;
      updateRegionTitle(region);
    });

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = `${pokemonData.nameEs} (#${pokemonData.id})`;

    listItem.appendChild(img);
    listItem.appendChild(checkbox);
    listItem.appendChild(label);

    listElement.appendChild(listItem);

    if (checkbox.checked) {
      listItem.classList.add('checked');
    }
  });

  updateRegionTitle(region);
}

// Nueva función para actualizar el título de cada región
function updateRegionTitle(region) {
  const titleElement = document.querySelector(`#${region} h2`);
  const checkboxes = document.querySelectorAll(`#${region} input[type="checkbox"]`);
  const checkedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
  titleElement.textContent = `${region.charAt(0).toUpperCase() + region.slice(1)} (${checkedCount}/${checkboxes.length})`;
}

async function fetchPokemonData(pokemonName) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
    const data = await response.json();
    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();
    const nameEs = speciesData.names.find(name => name.language.name === 'es').name;

    // Obtener todas las formas del Pokémon
    const formResponses = await Promise.all(data.forms.map(form => fetch(form.url)));
    const formDatas = await Promise.all(formResponses.map(res => res.json()));

    const forms = formDatas.map(formData => ({
      id: formData.id,
      name: formData.name,
      nameEs: formData.names.find(name => name.language.name === 'es')?.name || formData.name,
      sprites: formData.sprites
    }));

    return {
      id: data.id,
      name: data.name,
      nameEs: nameEs || data.name, // Asegurar que se muestre el nombre en inglés si no hay nombre en español
      sprites: data.sprites,
      forms: forms
    };
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
    return null;
  }
}

function handleRegionSelection() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      navLinks.forEach(link => link.classList.remove('active'));
      this.classList.add('active');
      const targetId = this.getAttribute('href').substring(1);
      adjustScroll(targetId);
    });
  });
}

// Función para sincronizar datos
function syncData() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('shiny-')) {
      // Enviar los datos al servidor o realizar la lógica de sincronización necesaria
      console.log(`Sincronizando ${key}: ${localStorage.getItem(key)}`);
      // Aquí puedes añadir la lógica para sincronizar con un servidor real
    }
  });
}

// Detectar el cambio de estado de conexión
window.addEventListener('online', syncData);

// Ajustar el desplazamiento
function adjustScroll(targetId) {
  const headerOffset = document.querySelector('header').offsetHeight;
  const element = document.getElementById(targetId);
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

// Función para filtrar Pokémon por nombre
function filterPokemon(event) {
  const searchTerm = event.target.value.toLowerCase();
  const pokemonItems = document.querySelectorAll('li[data-name]');

  pokemonItems.forEach(item => {
    const name = item.getAttribute('data-name');
    if (name.includes(searchTerm)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

document.getElementById('search-input').addEventListener('input', filterPokemon);

// Función para limpiar el buscador
document.getElementById('clear-search').addEventListener('click', function() {
  const searchInput = document.getElementById('search-input');
  searchInput.value = '';
  filterPokemon({ target: searchInput });
});

// Función para volver al inicio
document.getElementById('back-to-top').addEventListener('click', function(event) {
  event.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

window.onload = function() {
  loadRegion('kanto', 'kanto-list');
  loadRegion('johto', 'johto-list');
  loadRegion('hoenn', 'hoenn-list');
  loadRegion('sinnoh', 'sinnoh-list');
  loadRegion('unova', 'unova-list');
  loadRegion('kalos', 'kalos-list');
  loadRegion('alola', 'alola-list');
  loadRegion('galar', 'galar-list');
  loadRegion('paldea', 'paldea-list');
  loadRegion('otros', 'otros-list');
  handleRegionSelection();
}
