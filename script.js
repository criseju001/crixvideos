const form = document.getElementById('video-form');
const gallery = document.getElementById('video-gallery');
const videoUrlInput = document.getElementById('video-url');

const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const logoutBtn = document.getElementById('logout-btn');

const togglePasswordText = document.getElementById('toggle-password-text');

const CORRECT_PASSWORD = 'Cris01eJu'; 

const defaultThumb = "https://via.placeholder.com/300x169/000000/FFFFFF?text=Sem+Imagem";

let draggedItem = null;

function extractDriveId(url) {
  const filePattern = /\/d\/([\w-]+)/;
  const ucPattern = /id=([\w-]+)/;
  const fileMatch = url.match(filePattern);
  const ucMatch = url.match(ucPattern);
  return (fileMatch && fileMatch[1]) || (ucMatch && ucMatch[1]) || null;
}

function extractYoutubeId(url) {
    const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([\w-]+)/;
    const match = url.match(youtubePattern);
    return (match && match[1]) || null;
}

function getThumbUrl(url) {
  const driveId = extractDriveId(url);
  const youtubeId = extractYoutubeId(url);

  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}`;
  } else if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
  }

  return defaultThumb;
}

function loadVideos() {
  const videos = JSON.parse(localStorage.getItem('videos')) || [];
  gallery.innerHTML = '';
  if (videos.length === 0) {
    gallery.innerHTML = '<p>Nenhum vídeo adicionado ainda.</p>';
  } else {
    videos.forEach((video, index) => {
      const div = document.createElement('div');
      div.className = 'thumb';
      div.setAttribute('draggable', 'true');
      div.setAttribute('data-index', index);
      
      const videoURL = video.driveId 
        ? `https://drive.google.com/file/d/${video.driveId}/preview` 
        : video.url;

      div.innerHTML = `
        <img src="${video.thumb || defaultThumb}" alt="${video.title}">
        <button class="delete-btn" data-index="${index}">×</button>
      `;

      div.querySelector('img').addEventListener('click', () => {
        window.open(videoURL, '_blank');
      });

      div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteVideo(index);
      });

      div.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
      });

      div.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const targetThumb = e.target.closest('.thumb');
        if (targetThumb && targetThumb !== draggedItem) {
            document.querySelectorAll('.thumb').forEach(thumb => thumb.classList.remove('drag-over'));
            targetThumb.classList.add('drag-over');
        }
      });
      
      div.addEventListener('dragleave', (e) => {
          e.target.closest('.thumb').classList.remove('drag-over');
      });

      div.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropTarget = e.target.closest('.thumb');
        if (dropTarget && dropTarget !== draggedItem) {
          const fromIndex = parseInt(draggedItem.getAttribute('data-index'));
          const toIndex = parseInt(dropTarget.getAttribute('data-index'));
          reorderVideos(fromIndex, toIndex);
        }
        document.querySelectorAll('.thumb').forEach(thumb => thumb.classList.remove('drag-over'));
      });

      div.addEventListener('dragend', () => {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        document.querySelectorAll('.thumb').forEach(thumb => thumb.classList.remove('drag-over'));
      });

      div.addEventListener('touchstart', (e) => {
        draggedItem = e.target.closest('.thumb');
        draggedItem.classList.add('dragging');
      });
      div.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropTarget = targetElement.closest('.thumb');
        
        document.querySelectorAll('.thumb').forEach(thumb => thumb.classList.remove('drag-over'));
        if (dropTarget && dropTarget !== draggedItem) {
          dropTarget.classList.add('drag-over');
        }
      });
      div.addEventListener('touchend', (e) => {
        draggedItem.classList.remove('dragging');
        
        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropTarget = targetElement.closest('.thumb');

        if (dropTarget && dropTarget !== draggedItem) {
          const fromIndex = parseInt(draggedItem.getAttribute('data-index'));
          const toIndex = parseInt(dropTarget.getAttribute('data-index'));
          reorderVideos(fromIndex, toIndex);
        }
        draggedItem = null;
        document.querySelectorAll('.thumb').forEach(thumb => thumb.classList.remove('drag-over'));
      });
      
      gallery.appendChild(div);
    });
  }
}

function reorderVideos(fromIndex, toIndex) {
  const videos = JSON.parse(localStorage.getItem('videos')) || [];
  const [movedItem] = videos.splice(fromIndex, 1);
  videos.splice(toIndex, 0, movedItem);
  localStorage.setItem('videos', JSON.stringify(videos));
  loadVideos();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const url = videoUrlInput.value.trim();
  
  if (!url) {
    alert('Por favor, preencha a URL do vídeo.');
    return;
  }
  
  const driveId = extractDriveId(url);
  const youtubeId = extractYoutubeId(url);
  
  const newVideo = { 
    title: url, // Usa a URL como título
    url, 
    thumb: getThumbUrl(url),
    driveId: driveId,
    youtubeId: youtubeId
  };
  
  const videos = JSON.parse(localStorage.getItem('videos')) || [];
  videos.push(newVideo);
  localStorage.setItem('videos', JSON.stringify(videos));
  loadVideos();
  form.reset();
});

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const enteredPassword = passwordInput.value;
  if (enteredPassword === CORRECT_PASSWORD) {
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    localStorage.setItem('isLoggedIn', 'true');
    loadVideos();
  } else {
    errorMessage.textContent = 'Senha incorreta.';
    passwordInput.value = '';
  }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    appContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});

togglePasswordText.addEventListener('click', (e) => {
  e.preventDefault();
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    togglePasswordText.textContent = 'Esconder Senha';
  } else {
    passwordInput.type = 'password';
    togglePasswordText.textContent = 'Mostrar Senha';
  }
});

if (localStorage.getItem('isLoggedIn') === 'true') {
  loginContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  loadVideos();
}