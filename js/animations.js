/**
 * animations.js
 * Handles complex transitions and endgame sequences
 */

function playEndGameAnimation(winner) {
  stopTimer();
  stopBGM();
  
  // Slow down the world rotation
  TweenMax.to(window, 2, { speed: 0 });
  
  if (winner === 'wolf') {
    // Classic Wolf Catch animation
    monster.sit();
    hero.hang();
    monster.heroHolder.add(hero.mesh);
    playGameOverSound();
    
    // Camera zoom on the catch
    TweenMax.to(camera.position, 3, { 
      z: cameraPosGameOver, 
      y: 60, 
      x: -30, 
      ease: Power2.easeInOut 
    });
  } else {
    // Rabbit Escape animation
    monster.sit(); // Monster stays behind, looking sad
    hero.run();    // Hero keeps running away
    
    // Animate hero running off into the distance
    TweenMax.to(hero.mesh.position, 3, { 
      y: 100, 
      z: -400, 
      x: 200, 
      ease: Power2.easeIn,
      onComplete: function() {
        hero.mesh.visible = false;
      }
    });

    // Camera stays on the disappointed wolf
    TweenMax.to(camera.position, 3, { 
      z: cameraPosGameOver + 50, 
      y: 40, 
      x: 20, 
      ease: Power2.easeInOut 
    });
    
    playBonusSound(); // Or a "Victory" fanfare
  }
  
  // Show UI after a slight delay
  setTimeout(function() {
    fieldGameOver.className = "show";
    var overlay = document.getElementById("gameOverOverlay");
    if (overlay) overlay.className = "show";
    
    // Scale distance container for impact
    TweenMax.to(fieldDistanceContainer, 1, { 
      top: "20%", 
      scale: 1.2, 
      xPercent: -50, 
      ease: Back.easeOut 
    });
  }, 500);
}

function cinematicEntry() {
  // Start from further back and zoom in
  camera.position.z = cameraPosGame + 200;
  camera.position.y = 100;
  
  TweenMax.to(camera.position, 2, {
    z: cameraPosGame,
    y: 30,
    ease: Power3.easeInOut,
    onUpdate: function() {
      camera.lookAt(new THREE.Vector3(0, 30, 0));
    }
  });
}
