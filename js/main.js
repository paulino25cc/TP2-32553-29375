window.onload = function () {
    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    const game = new Phaser.Game(config);
    let score = 0;
    let coins = 0;
    let scoreText;
    let coinsText;
    let gameOverText;
    let pauseText;
    let menuText;
    let netTimerText;
    let shopText;
    let boostText;
    let isPaused = false;
    let hookSpeed = 170;
    let fishSpeedL = 150;
    let fishSpeedR = -150;
    let lulaSpeed = 150;
    let sharkSpeed = 150;
    let sharkSpawnDelay = 7000;
    let sharkTimer;
    let shopItems;
    let isShopOpen = false;
    let backgroundMusic;
    let currentVolume = 1.0;
    let boostItems;
    let isGameOver = false;
    let isBoostOpen = false;
    let isNetActive = false;
    let currentHook = { texture: 'hook1', scale: 0.07, speed: hookSpeed };
    let netTime = 5;

    let shopItemsConfig = [
        { name: 'Minhocanzol', cost: 50, speed: 250, texture: 'hook2', scale: 0.1 },
        { name: 'Isco Alegre', cost: 100, speed: 300, texture: 'hook3', scale: 0.1 }
    ];

    let boostItemsConfig = [
        { name: 'Aumentar Velocidade', cost: 50, effect: increaseHookSpeed, level: 0, maxLevel: 10 },
        { name: 'Aumentar Tempo da Rede', cost: 50, effect: increaseNetTime, level: 0, maxLevel: 10 }
    ];

    function preload() {
        this.load.binary('dinofiles', 'assets/fonts/dinofiles.ttf');
        // Carregar as imagens
        this.load.image('background', 'assets/map.png');
        this.load.image('fisher', 'assets/fisher.png');
        this.load.image('fishL', 'assets/redfish.png');
        this.load.image('fishR', 'assets/fishTile_rotated.png');
        this.load.image('lula', 'assets/lula.png');
        this.load.image('hook1', 'assets/hook.png');
        this.load.image('hook2', 'assets/hook2.png');
        this.load.image('hook3', 'assets/hook3.png');
        this.load.image('tubaraoL', 'assets/tubaraoL.png');
        this.load.image('tubaraoR', 'assets/tubaraoR.png');
        this.load.image('moeda', 'assets/moeda.webp');
        this.load.image('estrela', 'assets/estrela.png');
        this.load.image('rede', 'assets/rede.png');
        // Carregar sons
        this.load.audio('backgroundMusic', 'assets/sounds/music.mp3');
    }

    function create() {
    
        isGameOver = false;
        // Adicionar o fundo e ajustar a escala
        const background = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'background');
        background.setScale(
            Math.max(window.innerWidth / background.width, window.innerHeight / background.height)
        );

        // Adicionar o pescador
        this.fisher = this.physics.add.sprite(window.innerWidth / 2, 75, 'fisher').setCollideWorldBounds(false).setScale(0.5);

        // Adicionar a moeda
        this.moedaIcon = this.add.image(window.innerWidth - 60, 45, 'moeda').setScale(0.03);

        // Adicionar o anzol e ajustar sua hitbox
        this.hook = this.physics.add.sprite(window.innerWidth / 2, 150, currentHook.texture).setCollideWorldBounds(true).setScale(currentHook.scale);

        // Adicionar texto da pontuação
        scoreText = this.add.text((window.innerWidth / 2) + 250, 16, ' 0', { fontFamily: 'Dinofiles', fontSize: 42, color: '#FF7200' }).setOrigin(1, 0);

        // Adicionar texto para as moedas
        coinsText = this.add.text(window.innerWidth - 100, 16, ' moedas: ' + coins, { fontFamily: 'Dinofiles', fontSize: 42, color: '#FF7200' }).setOrigin(1, 0);

        menuText = this.add.text(150, 540, 'Menu: \nPausa-"ESC" \nShop-"S"\nBoosts-"B"\nRestart-"R" ', { fontFamily: 'Dinofiles', fontSize: 20, color: '#FFFFFF' }).setOrigin(1, 0);

        // Adicionar texto de game over (inicialmente invisível)
        gameOverText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Game Over', { fontFamily: 'Dinofiles', fontSize: 64, color: '#FF0000' });
        gameOverText.setOrigin(0.5);
        gameOverText.setVisible(false);

        // Adicionar texto de pausa (inicialmente invisível)
        pauseText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Pausa', { fontFamily: 'Dinofiles', fontSize: 60, color: '#ffffff' });
        pauseText.setOrigin(0.5);
        pauseText.setVisible(false);

        // Adicionar texto do temporizador da rede (inicialmente invisível)
        netTimerText = this.add.text(10, 60, '', { fontFamily: 'Dinofiles', fontSize: 30, color: '#FF7200' });
        netTimerText.setVisible(false);

        shopText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 100, 'Shop', { fontFamily: 'Dinofiles', fontSize: 60, color: '#FF7200' });
        shopText.setOrigin(0.5);
        shopText.setVisible(false);

        shopItems = this.add.group();

        shopItemsConfig.forEach((item, index) => {
            const itemText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + index * 50, `${item.name} (${item.cost} coins)`, { fontFamily: 'Dinofiles', fontSize: 30, color: '#FF7200' })
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', () => purchaseItem.call(this, item));

            shopItems.add(itemText);
        });

        shopItems.setVisible(false);

        // Adicionar texto do menu de boosts (inicialmente invisível)
        boostText = this.add.text(window.innerWidth / 2, window.innerHeight / 2-100 , 'Boosts', { fontFamily: 'Dinofiles', fontSize: 60, color: '#FF7200' });
        boostText.setOrigin(0.5);
        boostText.setVisible(false);

        boostItems = this.add.group();

        boostItemsConfig.forEach((item, index) => {
            const itemText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 -50 + index * 70, `${item.name} (${item.cost} moedas) + Nivel ${item.level}/${item.maxLevel}`, { fontFamily: 'Dinofiles', fontSize: 30, color: '#FF7200' })
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', () => incrementBoost.call(this, item, itemText));
            
            boostItems.add(itemText);
        });
        boostItems.setVisible(false);

        // Tocar a música de fundo
        if (!backgroundMusic) {
            backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
            backgroundMusic.play();
        }
        backgroundMusic.setVolume(currentVolume);

        // Adicionar controle de volume
        this.add.text(window.innerWidth / 2 - 75, window.innerHeight - 50, 'Volume:', { fontFamily: 'Dinofiles', fontSize: 30, color: '#ffffff' }).setOrigin(0.5);
        let volumeBar = this.add.graphics();
        let volumeLevel = currentVolume; 
        drawVolumeBar(volumeBar, window.innerWidth / 2, window.innerHeight - 57, volumeLevel); 

        this.input.on('pointerdown', (pointer) => {
            if (pointer.x >= window.innerWidth / 2 && pointer.x <= window.innerWidth / 2 + 150 && pointer.y >= window.innerHeight - 60 && pointer.y <= window.innerHeight - 40) {
                volumeLevel = (pointer.x - (window.innerWidth / 2)) / 150;
                backgroundMusic.setVolume(volumeLevel);
                currentVolume = volumeLevel; 
                drawVolumeBar(volumeBar, window.innerWidth / 2, window.innerHeight - 57, volumeLevel); 
            }
        });
        // Configurar entradas do teclado
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-ESC', togglePause, this);
        this.input.keyboard.on('keydown-R', restartGame, this);
        this.input.keyboard.on('keydown-S', toggleShop, this);
        this.input.keyboard.on('keydown-B', toggleBoosts, this);

        // Temporizadores para adicionar peixes, lulas e tubarões em intervalos
        this.time.addEvent({ delay: 2000, callback: spawnFishL, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 2000, callback: spawnFishR, callbackScope: this, loop: true, startAt: 1000 });
        this.time.addEvent({ delay: 5000, callback: spawnLula, callbackScope: this, loop: true, startAt: 3000 });
        sharkTimer = this.time.addEvent({ delay: sharkSpawnDelay, callback: spawnShark, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 5000, callback: increaseSpeed, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 10000, callback: spawnEstrela, callbackScope: this, loop: true });

        // Ajustar o redimensionamento da tela
        window.addEventListener('resize', resizeGame);
        resizeGame();
    }

    function update() {
        if (isPaused || isShopOpen || isBoostOpen|| isGameOver) {
            this.time.paused = true;
            this.physics.world.pause();
            pauseText.setVisible(isPaused);
            shopItems.setVisible(isShopOpen);
            shopText.setVisible(isShopOpen);
            boostItems.setVisible(isBoostOpen);
            boostText.setVisible(isBoostOpen);
            gameOverText.setVisible(isGameOver);
            return;
        } else {
            this.time.paused = false;
            this.physics.world.resume();
            pauseText.setVisible(false);
            shopItems.setVisible(false);
            shopText.setVisible(false);
            boostItems.setVisible(false);
            boostText.setVisible(false);
            gameOverText.setVisible(false);
        }
        // Movimentação do anzol usando as setas do teclado
        if (this.cursors.left.isDown) {
            this.hook.setVelocityX(-hookSpeed);
        } else if (this.cursors.right.isDown) {
            this.hook.setVelocityX(hookSpeed);
        } else {
            this.hook.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.hook.setVelocityY(-hookSpeed);
        } else if (this.cursors.down.isDown) {
            this.hook.setVelocityY(hookSpeed);
        } else {
            this.hook.setVelocityY(0);
        }

        // Sincronizar o pescador com o anzol
        this.fisher.setX(this.hook.x);

        // Resetar a posição dos peixes quando saem da tela
        if (this.fishL && this.fishL.x > window.innerWidth) {
            this.fishL.destroy();
            this.fishL = null;
        }

        if (this.fishR && this.fishR.x < 0) {
            this.fishR.destroy();
            this.fishR = null;
        }

        // Resetar a posição das lulas quando saem da tela
        if (this.lula) {
            if (this.lula.x > window.innerWidth) {
                this.lula.x = 0;
            } else if (this.lula.x < 0) {
                this.lula.x = window.innerWidth;
            }

            if (this.lula.y > window.innerHeight) {
                this.lula.y = 0;
            } else if (this.lula.y < 0) {
                this.lula.y = window.innerHeight;
            }
        }

        // Resetar a posição dos tubarões quando saem da tela
        if (this.sharkL && this.sharkL.x > window.innerWidth) {
            this.sharkL.destroy();
            this.sharkL = null;
        }

        if (this.sharkR && this.sharkR.x < 0) {
            this.sharkR.destroy();
            this.sharkR = null;
        }
    }

    function catchFish(hook, fish) {
        fish.disableBody(true, true);
        if (fish.texture.key === 'fishL' || fish.texture.key === 'fishR') {
            coins += 3;
            score += 10;
        } else if (fish.texture.key === 'lula') {
            coins += 5;
            score += 50;
        }
        coinsText.setText('Moedas: ' + coins);
        scoreText.setText(score);
        checkScoreAndIncreaseDifficulty.call(this);
    }

    function catchTubarao(hook, tubarao) {
        if (isNetActive) {
            tubarao.disableBody(true, true);
            coins += 10;
            score += 100;
            coinsText.setText('Moedas: ' + coins);
            scoreText.setText(score);
        } else {
            hookSpeed = 0;
            tubarao.setTint(0xff0000);
            hook.setTint(0xff0000);
            gameOverText.setVisible(true);

            this.time.delayedCall(100, () => {
                this.time.addEvent({
                    delay: 0,
                    callback: () => {
                        this.physics.world.pause();
                        isGameOver = true;
                        this.time.paused = true;
                        this.tweens.pauseAll();
                        this.input.keyboard.on('keydown-R', restartGame, this);
                    },
                    callbackScope: this,
                    loop: false
                });
            });
        }
    }

    function catchEstrela(hook, estrela) {
        if (estrela.texture.key === 'estrela') {
            estrela.disableBody(true, true);

            this.hook.setTexture('rede');
            this.hook.setScale(0.2);
            isNetActive = true;
            let netTimeRemaining = netTime;

            netTimerText.setVisible(true);
            netTimerText.setText(`IMUNE: ${netTimeRemaining}`);

            this.time.addEvent({
                delay: 1000,
                callback: () => {
                    netTimeRemaining--;
                    if (netTimeRemaining > 0) {
                        netTimerText.setText(`IMUNE: ${netTimeRemaining}`);
                    } else {
                        netTimerText.setVisible(false);
                        this.hook.setTexture(currentHook.texture);
                        this.hook.setScale(currentHook.scale);
                        hookSpeed = currentHook.speed;
                        isNetActive = false;
                    }
                },
                repeat: netTime - 1
            });
        }
    }

    function checkScoreAndIncreaseDifficulty() {
        if (score >= 100 && (score - 100) % 100 === 0) {
            increaseSpeed();
            if (score >= 100) {
                increaseSharkFrequency.call(this);
            }
        }
    }

    function increaseSpeed() {
        fishSpeedL += 10;
        fishSpeedR -= 10;
        lulaSpeed += 10;
        sharkSpeed += 10;
        hookSpeed += 10;
    }

    function increaseSharkFrequency() {
        if (sharkTimer) {
            sharkTimer.remove(false);
        }
        sharkSpawnDelay = Math.max(1000, sharkSpawnDelay - 1000);
        sharkTimer = this.time.addEvent({ delay: sharkSpawnDelay, callback: spawnShark, callbackScope: this, loop: true });
    }

    function spawnFishL() {
        const yPosition = Phaser.Math.Between(100, window.innerHeight - 300);
        const fishL = this.physics.add.sprite(-50, yPosition, 'fishL').setScale(0.7);
        fishL.setVelocityX(fishSpeedL);
        this.physics.add.overlap(this.hook, fishL, catchFish, null, this);
    }

    function spawnEstrela() {
        const yPosition = Phaser.Math.Between(100, window.innerHeight - 100);
        const xPosition = Phaser.Math.Between(0, window.innerWidth);
        const estrela = this.physics.add.sprite(xPosition, yPosition, 'estrela').setScale(0.1);
        this.time.addEvent({ delay: 3000, callback: () => { if (estrela.active) { estrela.destroy(); } }, callbackScope: this });
        this.physics.add.overlap(this.hook, estrela, catchEstrela, null, this);
    }

    function spawnFishR() {
        const yPosition = Phaser.Math.Between(100, window.innerHeight - 300);
        const fishR = this.physics.add.sprite(window.innerWidth + 50, yPosition, 'fishR').setScale(0.7);
        fishR.setVelocityX(fishSpeedR);
        this.physics.add.overlap(this.hook, fishR, catchFish, null, this);
    }

    function spawnLula() {
        const yPosition = Phaser.Math.Between(100, window.innerHeight - 100);
        const lula = this.physics.add.sprite(Phaser.Math.Between(0, window.innerWidth), yPosition, 'lula').setScale(0.15);
        lula.setVelocity(Phaser.Math.Between(-lulaSpeed, lulaSpeed), Phaser.Math.Between(-lulaSpeed, lulaSpeed));
        this.physics.add.overlap(this.hook, lula, catchFish, null, this);
    }

    function spawnShark() {
        const side = Phaser.Math.Between(0, 1);
        let shark;
        const yPosition = Phaser.Math.Between(100, window.innerHeight - 100);
        if (side === 0) {
            shark = this.physics.add.sprite(-50, yPosition, 'tubaraoL').setScale(0.2);
            shark.setVelocityX(sharkSpeed);
        } else {
            shark = this.physics.add.sprite(window.innerWidth + 50, yPosition, 'tubaraoR').setScale(0.2);
            shark.setVelocityX(-sharkSpeed);
        }
        this.physics.add.overlap(this.hook, shark, catchTubarao, null, this);
    }

    function purchaseItem(item) {
        if (coins >= item.cost) {
            coins -= item.cost;
            coinsText.setText('Moedas: ' + coins);
            this.hook.setTexture(item.texture);
            this.hook.setScale(item.scale);
            hookSpeed = item.speed;
            currentHook = { texture: item.texture, scale: item.scale, speed: item.speed };
            toggleShop();
        }
    }

    function incrementBoost(item, itemText) {
        if (item.level < item.maxLevel && coins >= item.cost) {
            coins -= item.cost;
            item.level += 1;
            item.effect(); 
            coinsText.setText('Moedas: ' + coins);
            itemText.setText(`${item.name} (${item.cost} moedas) + Nível ${item.level}/${item.maxLevel}`);
        }
    }

    function increaseHookSpeed() {
        hookSpeed += 15;
    }

    function increaseNetTime() {
        netTime += 0.5;
    }

    function togglePause() {
        isPaused = !isPaused;
    }

    function toggleShop() {
        isShopOpen = !isShopOpen;
    }

    function toggleBoosts() {
        isBoostOpen = !isBoostOpen;
    }

    function restartGame() {
        score = 0;
        fishSpeedL = 150;
        fishSpeedR = -150;
        lulaSpeed = 150;
        sharkSpeed = 150;
        hookSpeed = currentHook.speed;  
        sharkSpawnDelay = 7000;
        isNetActive = false;
        netTimerText.setVisible(false);
        coinsText.setText('Moedas: ' + coins); 

        this.scene.restart();
    }

    function drawVolumeBar(graphics, x, y, level) {
        graphics.clear();
        graphics.fillStyle(0x888888);
        graphics.fillRect(x, y, 150, 20);
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(x, y, 150 * level, 20);
    }


    function resizeGame() {
        const canvas = game.canvas;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        game.scale.resize(window.innerWidth, window.innerHeight);
    }
};
