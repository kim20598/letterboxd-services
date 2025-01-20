/**
 * @typedef {Object} ServiceData
 * @property {string} name - The service's name.
 * @property {string} url - The service's search URL.
 * @property {string} icon - The service's icon URL.
 */

/**
 * Parse the page for the film's IMDb ID
 *
 * @returns {string|null} IMDb ID or null if not found
 */
const getImdbID = () => {
  const url = document.querySelector(".micro-button")?.href;
  const id = url?.split("/")[4];
  return id?.startsWith("tt") ? id : null; // Validate that it starts with "tt"
};

/**
 * Parse the page for the film's TMDb ID
 *
 * @returns {string|null} TMDb ID or null if not found
 */
const getTmdbID = () => {
  const url = document.querySelector(".tmdb-button")?.href;
  const id = url?.split("/").pop(); // Extract the last part of the URL
  return id && /^\d+$/.test(id) ? id : null; // Validate that it's numeric
};

/**
 * Parse the page for the film's title and release year
 *
 * @returns {string} Film's query (title and year) or empty string
 */
const getQuery = () => {
   const details = document.querySelector(".details");
  const title = details?.querySelector("h1")?.innerText;
  const year = details?.querySelector(".releaseyear > a")?.innerText;
  const rawQuery = `${title ?? ""}`;
  return rawQuery.replace(/\s+/g, "-"); // Replace spaces with hyphens
};

/**
 * Extract the film name (slug) from the Letterboxd URL
 *
 * @returns {string|null} Film name (slug) or null if not found
 */
const getLetterboxdFilmName = () => {
  const url = window.location.href; // Get the current URL
  const match = url.match(/letterboxd.com\/film\/([^/]+)/); // Extract name after "/film/"
  return match ? match[1] : null; // Return the film name (slug)
};

/**
 * Fetch the TMDb ID for a given film name using the TMDb API
 *
 * @param {string} filmName - The name (slug) of the film
 * @returns {Promise<string|null>} The TMDb ID or null if not found
 */
const fetchTmdbIdFromLetterboxd = async (filmName) => {
  const apiKey = 'e5bb3f8f15d40063752ff87b4c360b05'; // Replace with your TMDb API key
  const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(filmName)}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return the TMDb ID of the first result
      return data.results[0].id;
    } else {
      console.error('Movie not found on TMDb');
      return null;
    }
  } catch (error) {
    console.error('Error fetching TMDb data:', error);
    return null;
  }
};

/**
 * Creates an HTML element with optional attributes and content
 *
 * @param {string} tag - Tag name of the element
 * @param {Object} [attributes] - Key-value pairs for attributes
 * @param {Node[]} [children] - Child nodes to append
 * @returns {HTMLElement} The created element
 */
const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  children.forEach((child) => element.append(child));
  return element;
};

/**
 * Creates an image element for the service icon
 *
 * @param {string} iconURL
 * @returns {HTMLImageElement} Service's icon element
 */
const createServiceIcon = (iconURL) => {
  return createElement("img", { src: iconURL, width: "20", height: "20" });
};

/**
 * Adds a service to the services section
 *
 * @param {ServiceData} serviceData
 */
const addService = (serviceData) => {
  const services = document.querySelector(".services");
  if (!services) return;

  const { name, url, icon } = serviceData;
  const brand = createElement("span", { class: "brand" }, [createServiceIcon(icon)]);
  const title = createElement("span", { class: "title" }, [document.createTextNode(name)]);
  const serviceLink = createElement("a", { href: url, target: "_blank", class: "label" }, [brand, title]);
  const serviceItem = createElement("p", { class: "service" }, [serviceLink]);

  services.append(serviceItem);
};

/**
 * Initialize the page to remove the unwanted content and add custom styles
 */
const initPage = () => {
  const style = createElement("style", {}, [
    document.createTextNode(`.services > .service {display: flex !important;}`)
  ]);
  document.head.append(style);

  const servicesSection = createElement("section", { class: "services" });
  const watchSection = document.getElementById("watch");
  if (watchSection) {
    watchSection.replaceWith(servicesSection);
  }
};

window.onload = async () => {
  initPage();

  const query = getQuery();
  const imdbId = getImdbID();
  const tmdbId = getTmdbID();

  let fetchedTmdbId = tmdbId;

  // If we don't find TMDb ID on the page, try to fetch it from Letterboxd
  if (!fetchedTmdbId) {
    const filmName = getLetterboxdFilmName();
    if (filmName) {
      fetchedTmdbId = await fetchTmdbIdFromLetterboxd(filmName);
    }
  }

  if (!query || (!imdbId && !fetchedTmdbId)) {
    console.error("Failed to retrieve query, IMDb ID, or TMDb ID.");
    return;
  }

  const services = globalThis.getServices?.(query, imdbId, fetchedTmdbId) || [];
  for (const service of services) {
    addService(service);
  }
};
