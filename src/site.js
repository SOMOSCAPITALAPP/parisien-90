const params = new URLSearchParams(window.location.search);
const query = params.get("q");

if (query) {
  const marker = document.createElement("p");
  marker.className = "search-result-note";
  marker.textContent = `Recherche : ${query}`;
  document.querySelector("main")?.prepend(marker);
}
