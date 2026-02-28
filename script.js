        // --- KONFIGURASI ---
        const totalPhotos = 120;
        const photosPerLoad = 12;
        
        // Koleksi foto dengan kategori berbeda
        const categories = ['day 1', 'day 2', 'day 3'];
        
        const generatePhotos = (start, count, category = 'all') => {
            const photos = [];
            for (let i = start; i < start + count; i++) {
                if(i >= totalPhotos) break;
                
                const seed = i + 100;
                const categoryIndex = i % categories.length;
                const photoCategory = categories[categoryIndex];
                
                // Filter berdasarkan kategori
                if (category !== 'all' && photoCategory !== category) {
                    continue;
                }
                
                photos.push({
                    id: i,
                    thumb: `https://picsum.photos/seed/${seed}/400/400`,
                    full: `https://picsum.photos/seed/${seed}/1920/1080`,
                    alt: `Foto ${i + 1}`,
                    category: photoCategory,
                    title: `Karya Seni #${i + 1}`,
                    photographer: `Fotografer ${categoryIndex + 1}`
                });
            }
            return photos;
        };

        // --- STATE MANAGEMENT ---
        let allPhotos = [];
        let currentLoaded = 0;
        let currentCategory = 'all';
        let currentPhotoIndex = 0;
        
        const galleryContainer = document.getElementById('gallery');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loader = document.getElementById('loader');
        const photoCountEl = document.getElementById('photoCount');
        const filterBtns = document.querySelectorAll('.filter-btn');

        // --- INTERSECTION OBSERVER (LAZY LOADING) ---
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.onload = () => {
                            img.classList.add('loaded');
                            img.style.animation = 'fadeIn 0.5s ease';
                        };
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: "200px",
            threshold: 0.1
        });

        // --- RENDER FUNCTIONS ---
        function renderPhotos(photos) {
            photos.forEach(photo => {
                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.dataset.category = photo.category;
                
                div.innerHTML = `
                    <img data-src="${photo.thumb}" alt="${photo.alt}" data-full="${photo.full}" data-title="${photo.title}" data-photographer="${photo.photographer}">
                    <div class="image-info">
                        <strong>${photo.title}</strong>
                        <span>By ${photo.photographer}</span>
                        <span>${photo.category}</span>
                    </div>
                `;

                div.addEventListener('click', () => {
                    currentPhotoIndex = allPhotos.findIndex(p => p.id === photo.id);
                    openLightbox(photo);
                });
                
                galleryContainer.appendChild(div);
                
                const img = div.querySelector('img');
                imageObserver.observe(img);
            });
        }

        function clearGallery() {
            galleryContainer.innerHTML = '';
            currentLoaded = 0;
        }

        function filterPhotos(category) {
            currentCategory = category;
            clearGallery();
            
            const filteredPhotos = allPhotos.filter(photo => 
                category === 'all' ? true : photo.category === category
            );
            
            renderPhotos(filteredPhotos.slice(0, photosPerLoad));
            currentLoaded = Math.min(photosPerLoad, filteredPhotos.length);
            
            updateCounter(filteredPhotos.length);
            
            // Update load more button state
            if (currentLoaded >= filteredPhotos.length) {
                loadMoreBtn.disabled = true;
            } else {
                loadMoreBtn.disabled = false;
            }
        }

        function loadMore() {
            loadMoreBtn.style.display = 'none';
            loader.style.display = 'block';

            setTimeout(() => {
                const filteredPhotos = allPhotos.filter(photo => 
                    currentCategory === 'all' ? true : photo.category === currentCategory
                );
                
                const nextPhotos = filteredPhotos.slice(currentLoaded, currentLoaded + photosPerLoad);
                
                if (nextPhotos.length > 0) {
                    renderPhotos(nextPhotos);
                    currentLoaded += nextPhotos.length;
                }
                
                updateCounter(filteredPhotos.length);
                
                loader.style.display = 'none';
                
                if (currentLoaded < filteredPhotos.length) {
                    loadMoreBtn.style.display = 'inline-block';
                } else {
                    loadMoreBtn.disabled = true;
                }
            }, 500);
        }

        function updateCounter(totalFiltered = null) {
            const total = totalFiltered || allPhotos.filter(photo => 
                currentCategory === 'all' ? true : photo.category === currentCategory
            ).length;
            photoCountEl.textContent = `${currentLoaded} / ${total}`;
        }

        // --- LIGHTBOX LOGIC ---
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxCaption = document.getElementById('lightboxCaption');
        const closeLightbox = document.getElementById('closeLightbox');
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        const lightboxLoader = document.getElementById('lightboxLoader');

        function openLightbox(photo) {
            lightboxLoader.style.display = 'block';
            lightboxImg.style.opacity = '0';
            
            // Preload full image
            const img = new Image();
            img.onload = () => {
                lightboxImg.src = photo.full;
                lightboxImg.style.opacity = '1';
                lightboxLoader.style.display = 'none';
            };
            img.src = photo.full;
            
            lightboxCaption.innerHTML = `
                <strong>${photo.title}</strong><br>
                <span style="color: #666;">By ${photo.photographer} • ${photo.category}</span>
            `;
            
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function navigateLightbox(direction) {
            const filteredPhotos = allPhotos.filter(photo => 
                currentCategory === 'all' ? true : photo.category === currentCategory
            );
            
            if (direction === 'next') {
                currentPhotoIndex = (currentPhotoIndex + 1) % filteredPhotos.length;
            } else {
                currentPhotoIndex = (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
            }
            
            openLightbox(filteredPhotos[currentPhotoIndex]);
        }

        function closeLightboxFunc() {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightboxImg.src = '';
            }, 300);
            document.body.style.overflow = 'auto';
        }

        // --- EVENT LISTENERS ---
        loadMoreBtn.addEventListener('click', loadMore);
        
        closeLightbox.addEventListener('click', closeLightboxFunc);
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox('prev');
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox('next');
        });
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightboxFunc();
        });

        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterPhotos(btn.dataset.filter);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'Escape') closeLightboxFunc();
                if (e.key === 'ArrowLeft') navigateLightbox('prev');
                if (e.key === 'ArrowRight') navigateLightbox('next');
            }
        });

        // --- INITIALIZATION ---
        // Generate all photos
        for (let i = 0; i < totalPhotos; i += photosPerLoad) {
            allPhotos = [...allPhotos, ...generatePhotos(i, photosPerLoad)];
        }
        
        // Load initial batch
        filterPhotos('all');
