function renderCategories(products){
    const container = document.getElementById('categoriesGrid');
    if(!container) return;
    const cats = getUniqueCategoriesWithCount(products);
    container.innerHTML = cats.map(cat => `
      <div class="category-tile" data-category="${escapeHTML(cat.name)}">
        <a href="category.html?cat=${encodeURIComponent(cat.name)}" style="text-decoration:none;color:inherit;">
          <div class="category-image">
            <img src="${cat.sampleImage}" loading="lazy" alt="${escapeHTML(cat.name)}" onerror="this.src='images/placeholder.svg'">
          </div>
          <div class="category-name">${escapeHTML(cat.name)} (${cat.count})</div>
        </a>
      </div>
    `).join('');
}