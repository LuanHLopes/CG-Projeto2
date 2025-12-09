import "./utils.js";
import "./scripts/fisica.js";
import "./scripts/movimento.js";
import "./scripts/placar.js";
import "./scripts/trajetoria.js";
import "./scripts/arremesso.js";
import "./scripts/placar-render.js";
import "./scripts/timer.js";
import "./scripts/debug-zonas.js";
import "./scripts/menu-placar.js";
import "./scripts/loader.js";

AFRAME.registerComponent('gerador-quarteirao', {
  schema: {
    textura: {type: 'string', default: '#tex-fachada-predio'}
  },

  init: function () {
    const el = this.el;
    const texturaId = this.data.textura;
    
    const cores = ['#E6B8B8', '#E6C288', '#D2B48C', '#FFDAB9'];

    const posicoes = [];
    
    // --- GERAÇÃO DAS POSIÇÕES ---
    
    // Fundo
    for(let x = -30; x <= 30; x += 15) {
        posicoes.push({x: x, z: -25, rot: 0});
    }
    // Frente
    for(let x = -30; x <= 30; x += 15) {
        posicoes.push({x: x, z: 25, rot: 180});
    }
    // Lateral Esquerda
    for(let z = -15; z <= 15; z += 15) {
        posicoes.push({x: -35, z: z, rot: 90});
    }
    // Lateral Direita
    for(let z = -15; z <= 15; z += 15) {
        posicoes.push({x: 35, z: z, rot: -90});
    }

    posicoes.forEach(pos => {
      // Container do prédio
      const predio = document.createElement('a-entity');
      predio.setAttribute('position', {x: pos.x, y: 0, z: pos.z});
      predio.setAttribute('rotation', {x: 0, y: pos.rot, z: 0});

      // --- DIMENSÕES COM ESPAÇAMENTO ---
      const w = 12; 
      const d = 12;
      const h = 25 + Math.random() * 15; // Altura entre 25 e 40

      // --- O PRÉDIO (Sem a parte cinza) ---
      const torre = document.createElement('a-box');
      torre.setAttribute('width', w);
      torre.setAttribute('height', h);
      torre.setAttribute('depth', d);
      torre.setAttribute('position', {x: 0, y: h / 2, z: 0});
      
      const corRandom = cores[Math.floor(Math.random() * cores.length)];
      torre.setAttribute('color', corRandom);

      torre.setAttribute('material', {
        src: texturaId,
        repeat: `${w/4} ${h/3}`, 
        roughness: 1
      });

      torre.setAttribute('shadow', 'cast: true; receive: true');

      predio.appendChild(torre);
      el.appendChild(predio);
    });
  }
});

console.log("Todos os scripts do jogo foram carregados!");