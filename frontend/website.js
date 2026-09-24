const menuButton = document.querySelector('.menu');
const navigation = document.querySelector('.navlinks');
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

// Keep the supplied banner visible even when the database is unavailable.
async function loadSchoolBanners() {
  try {
    const response = await fetch('/api/banners');
    if (!response.ok) return;
    const data = await response.json();
    const banners = (Array.isArray(data.banners) ? data.banners : [])
      .filter(banner => banner.isActive !== false && banner.imageUrl);
    const container = document.querySelector('.additional-banners');
    for (const banner of banners) {
      const url = new URL(banner.imageUrl, window.location.origin);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const img = document.createElement('img');
      img.src = url.href;
      img.alt = banner.title || 'Green Land Model School Jand announcement';
      img.loading = 'lazy';
      img.addEventListener('error', () => img.remove());
      container.append(img);
    }
  } catch (_) { /* Static school content remains available offline. */ }
}
loadSchoolBanners();
