// create-local-photos.js - Crear fotos de perfil locales
const fs = require('fs');
const path = require('path');

async function createLocalPhotos() {
  try {
    console.log('🎨 Creando fotos de perfil locales...\n');
    
    // Crear directorio si no existe
    const profilesDir = path.join(__dirname, '..', '..', 'C:', 'ImagenesCompartidas', 'uploads', 'profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
      console.log('📁 Directorio creado:', profilesDir);
    }
    
    // Fotos de perfil de prueba (SVG simples)
    const testPhotos = [
      {
        filename: 'profile1.svg',
        content: `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
          <circle cx="75" cy="75" r="75" fill="#007AFF"/>
          <circle cx="75" cy="60" r="25" fill="white"/>
          <path d="M30 120 Q75 100 120 120 L120 150 L30 150 Z" fill="white"/>
        </svg>`
      },
      {
        filename: 'profile2.svg',
        content: `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
          <circle cx="75" cy="75" r="75" fill="#34C759"/>
          <circle cx="75" cy="60" r="25" fill="white"/>
          <path d="M30 120 Q75 100 120 120 L120 150 L30 150 Z" fill="white"/>
        </svg>`
      },
      {
        filename: 'profile3.svg',
        content: `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
          <circle cx="75" cy="75" r="75" fill="#FF9500"/>
          <circle cx="75" cy="60" r="25" fill="white"/>
          <path d="M30 120 Q75 100 120 120 L120 150 L30 150 Z" fill="white"/>
        </svg>`
      },
      {
        filename: 'profile4.svg',
        content: `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
          <circle cx="75" cy="75" r="75" fill="#FF3B30"/>
          <circle cx="75" cy="60" r="25" fill="white"/>
          <path d="M30 120 Q75 100 120 120 L120 150 L30 150 Z" fill="white"/>
        </svg>`
      },
      {
        filename: 'profile5.svg',
        content: `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
          <circle cx="75" cy="75" r="75" fill="#AF52DE"/>
          <circle cx="75" cy="60" r="25" fill="white"/>
          <path d="M30 120 Q75 100 120 120 L120 150 L30 150 Z" fill="white"/>
        </svg>`
      },
      {
        filename: 'profile6.svg',
        content: `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
          <circle cx="75" cy="75" r="75" fill="#5AC8FA"/>
          <circle cx="75" cy="60" r="25" fill="white"/>
          <path d="M30 120 Q75 100 120 120 L120 150 L30 150 Z" fill="white"/>
        </svg>`
      }
    ];
    
    console.log('🔄 Creando archivos de fotos...');
    
    for (const photo of testPhotos) {
      try {
        const filePath = path.join(profilesDir, photo.filename);
        fs.writeFileSync(filePath, photo.content);
        console.log(`✅ Foto creada: ${photo.filename}`);
      } catch (error) {
        console.log(`❌ Error creando ${photo.filename}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Fotos de perfil locales creadas exitosamente!');
    console.log('📁 Ubicación:', profilesDir);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createLocalPhotos();
