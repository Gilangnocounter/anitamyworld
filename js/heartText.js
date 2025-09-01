import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class HeartText {
    constructor(scene) {
        this.scene = scene;
        this.textMesh = null;
        this.textGroup = new THREE.Group();
        this.scene.add(this.textGroup);

        // Configuration options
        this.config = {
            text: 'Only For You, Ayu Anita Purnama 🤍',
            size: 20,
            height: 2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.2,
            bevelOffset: 0,
            bevelSegments: 5,
            position: { x: 0, y: 350, z: 0 },
            color: 0xffffff, // Trắng
            emissiveColor: 0xffffff, // Trắng
            emissiveIntensity: 0.5, // Nhẹ, không lấn màu
            metalness: 0.3,
            roughness: 0.2,
            effectType: 'none',
            effectSpeed: 1.0,
            effectIntensity: 1.0,
            fontName: 'bevietnampro', // Thêm fontName
            appearEffect: 'none' // Thêm thuộc tính hiệu ứng xuất hiện
        };

        this.effectType = this.config.effectType;
        this.font = null; // Store loaded font
        
        // Kiểm tra xem có phải web con không
        const isWebCon = window.location.hash.includes('#id=') || window.location.hash.includes('#config=');
        
        // Flag để kiểm soát việc ẩn/hiện
        this.isHidden = isWebCon; // Web con mặc định ẩn
        
        // Mặc định hiển thị text group (cho web cha), ẩn cho web con
        this.textGroup.visible = !isWebCon;

        // Thêm thuộc tính cho hiệu ứng fade in
        this.fadeInStartTime = null;
        this.fadeInDuration = 3500; // 3.5 giây
        
        this.loadFont().then(() => this.renderText3D());
    }

    async loadFont(fontName = this.config.fontName) {
        const loader = new FontLoader();
        const fontMap = {
            bevietnampro: 'assets/fonts/BeVietnamPro_Regular.json',
            intertight: 'assets/fonts/InterTight_Regular.json',
            meow_script: 'assets/fonts/MeowScript_Regular.json',
            googlesanscode: 'assets/fonts/GoogleSansCode_Regular.json',
            pacifico: 'assets/fonts/Pacifico_Regular.json',
            updock: 'assets/fonts/Updock_Regular.json',
            alumni_sans_pinstripe: 'assets/fonts/AlumniSansPinstripe_Regular.json',
            dancing_script: 'assets/fonts/DancingScript_Regular.json',
            cormorantunicase: 'assets/fonts/CormorantUnicase_Regular.json',
        };
        const fontUrl = fontMap[fontName];
        if (!fontUrl) {
            console.error(`Font "${fontName}" không tồn tại trong fontMap!`);
            return;
        }
        try {
            this.font = await new Promise((resolve, reject) => {
                loader.load(fontUrl, resolve, undefined, reject);
            });
        } catch (error) {
            console.error('Error loading font:', error);
        }
    }

    renderText3D(newText) {
        
        // Xóa toàn bộ mesh cũ
        if (this.textGroup) {
            while (this.textGroup.children.length > 0) {
                const obj = this.textGroup.children[0];
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose && obj.material.dispose();
                this.textGroup.remove(obj);
            }
        }
        this.textMeshes = []; // Lưu tất cả mesh dòng
        if (!this.font) return;
        if (typeof newText === 'string') {
            this.config.text = newText;
        }
        const lines = this.config.text.split('\n');
        const lineHeight = this.config.size * 1.2;
        lines.forEach((line, i) => {
            const textGeometry = new TextGeometry(line, {
                font: this.font,
                size: this.config.size,
                height: this.config.height,
                curveSegments: this.config.curveSegments,
                bevelEnabled: this.config.bevelEnabled,
                bevelThickness: this.config.bevelThickness,
                bevelSize: this.config.bevelSize,
                bevelOffset: this.config.bevelOffset,
                bevelSegments: this.config.bevelSegments
            });
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            const textMaterial = new THREE.MeshStandardMaterial({
                color: this.config.color,
                metalness: this.config.metalness,
                roughness: this.config.roughness,
                emissive: this.config.emissiveColor,
                emissiveIntensity: this.config.emissiveIntensity,
                transparent: true
            });
            const mesh = new THREE.Mesh(textGeometry, textMaterial);
            mesh.position.set(
                this.config.position.x - textWidth / 2,
                this.config.position.y - i * lineHeight,
                this.config.position.z
            );
            // Nếu height < 1 thì scale z để giả lập mỏng
            if (this.config.height < 1) {
                mesh.scale.z = this.config.height;
            }
            this.textGroup.add(mesh);
            this.textMeshes.push(mesh);
        });
        // Thêm ánh sáng riêng cho text và điều chỉnh vị trí ánh sáng theo text (chỉ 1 lần)
        if (!this._textLight) {
            const textLight = new THREE.SpotLight(0xffffff, 5, 480, Math.PI / 4, 0.5, 1);
            textLight.position.set(0, 510, 100);
            this.textGroup.add(textLight);
            this._textLight = textLight;
        }
        if (!this._ambientLight) {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.textGroup.add(ambientLight);
            this._ambientLight = ambientLight;
        }
        
        // Khôi phục trạng thái visible dựa trên flag
        if (this.textGroup) {
            this.textGroup.visible = !this.isHidden;
        }
        
        window.heartText = this;
        
        // Phát sự kiện khi text3D sẵn sàng (để web con biết đã render xong)
        try { document.dispatchEvent(new CustomEvent('hearttext_ready')); } catch (e) {}
    }

    // Xóa hàm autoWrapText (không cần wrap tự động nữa)

    // Sửa setText để không wrap, chỉ set text và render
    setText(text) {
        this.config.text = text;
        this.renderText3D();
        if (this.textMeshes) {
            this.textMeshes.forEach(mesh => {
                mesh.material.color.setHex(this.config.color);
                mesh.material.emissive.setHex(this.config.color);
            });
        }
    }
    setFont(fontName) {
        this.config.fontName = fontName;
        this.loadFont(fontName).then(() => {
            this.renderText3D();
            if (this.textMeshes) {
                this.textMeshes.forEach(mesh => {
                    mesh.material.color.setHex(this.config.color);
                    mesh.material.emissive.setHex(this.config.color);
                });
            }
        });
    }
    setSize(size) {
        this.config.size = size;
        this.renderText3D();
    }
    setHeight(height) {
        if (height < 1) {
            this.config.height = 1;
            this.renderText3D();
            // scale z sẽ được set trong renderText3D
        } else {
            this.config.height = height;
            this.renderText3D();
        }
    }
    setColor(color) {
        this.config.color = color;
        this.renderText3D();
        if (this.textMeshes) {
            this.textMeshes.forEach(mesh => {
                mesh.material.color.setHex(color);
                mesh.material.emissive.setHex(color);
            });
        }
    }
    setEmissiveColor(color) {
        this.config.emissiveColor = color;
        this.renderText3D();
    }
    setPosition(x, y, z) {
        this.config.position = { x, y, z };
        this.renderText3D();
    }

    // Set hiệu ứng xuất hiện
    setAppearEffect(effect) {
        this.config.appearEffect = effect;
    }

    // Configuration methods
    setConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.effectType = this.config.effectType;
        this.renderText3D(); // Recreate text with new config
    }

    // Animation effects
    floatEffect(time) {
        const speed = this.config.effectSpeed;
        const intensity = this.config.effectIntensity;
        const baseY = this.config.position.y;

        this.textMesh.position.y = baseY + Math.sin(time * 2 * speed) * (5 * intensity);
        this.textMesh.rotation.y = Math.sin(time * 0.5 * speed) * (0.1 * intensity);
    }

    fadeEffect(time) {
        const speed = this.config.effectSpeed;
        const intensity = this.config.effectIntensity;
        const opacity = ((Math.sin(time * speed) + 1) / 2) * intensity;
        this.textMesh.material.opacity = Math.max(0.2, opacity); // Never fully transparent
    }

    rainbowEffect(time) {
        const speed = this.config.effectSpeed;
        const intensity = this.config.effectIntensity;
        const hue = (time * 0.1 * speed) % 1;
        const color = new THREE.Color();
        color.setHSL(hue, 1, 0.5 * intensity);
        this.textMesh.material.color = color;
        this.textMesh.material.emissive = color;
    }

    pulseEffect(time) {
        const speed = this.config.effectSpeed;
        const intensity = this.config.effectIntensity;
        const scale = 1 + Math.sin(time * 3 * speed) * 0.1 * intensity;
        this.textMesh.scale.set(scale, scale, scale);
    }

    glowEffect(time) {
        const speed = this.config.effectSpeed;
        const intensity = this.config.effectIntensity;
        const glow = (Math.sin(time * speed) + 1) / 2 * intensity;
        this.textMesh.material.emissiveIntensity = glow;
    }

    // Animation management
    animate() {
        if (!this.textMeshes || this.textMeshes.length === 0) return;
        const time = Date.now() * 0.001;

        // Xử lý hiệu ứng fade in nếu đang chạy
        if (this.fadeInStartTime !== null) {
            const elapsed = Date.now() - this.fadeInStartTime;
            const progress = Math.min(elapsed / this.fadeInDuration, 1);

            // Sử dụng easeInOut để tạo hiệu ứng mượt mà
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            this.textMeshes.forEach(mesh => {
                mesh.material.opacity = easeProgress;
            });

            // Dừng hiệu ứng fade in khi hoàn thành
            if (progress >= 1) {
                this.fadeInStartTime = null;
                this.textMeshes.forEach(mesh => {
                    mesh.material.opacity = 1;
                });
            }
            return; // Không chạy các hiệu ứng khác khi đang fade in
        }

        switch (this.effectType) {
            case 'none':
                this.textMeshes.forEach((mesh, idx) => {
                    const textWidth = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
                    mesh.position.set(
                        this.config.position.x - textWidth / 2,
                        this.config.position.y - idx * this.config.size * 1.2,
                        this.config.position.z
                    );
                    mesh.rotation.set(0, 0, 0);
                    mesh.scale.set(1, 1, this.config.height < 1 ? this.config.height : 1);
                    mesh.material.opacity = 1;
                    mesh.material.emissiveIntensity = this.config.emissiveIntensity;
                });
                break;
            case 'float':
                this.textMeshes.forEach((mesh, idx) => {
                    const baseY = this.config.position.y - idx * this.config.size * 1.2;
                    mesh.position.y = baseY + Math.sin(time * 2 * this.config.effectSpeed) * (5 * this.config.effectIntensity);
                    mesh.rotation.y = Math.sin(time * 0.5 * this.config.effectSpeed) * (0.1 * this.config.effectIntensity);
                });
                break;
            case 'fade':
                this.textMeshes.forEach((mesh, idx) => {
                    const opacity = ((Math.sin(time * this.config.effectSpeed) + 1) / 2) * this.config.effectIntensity;
                    mesh.material.opacity = Math.max(0.2, opacity);
                });
                break;
            case 'rainbow':
                this.textMeshes.forEach((mesh, idx) => {
                    const hue = ((time * 0.1 * this.config.effectSpeed) % 1);
                    const color = new THREE.Color();
                    color.setHSL(hue, 1, 0.5 * this.config.effectIntensity);
                    mesh.material.color = color;
                    mesh.material.emissive = color;
                });
                break;
            case 'pulse':
                this.textMeshes.forEach((mesh, idx) => {
                    const scale = 1 + Math.sin(time * 3 * this.config.effectSpeed) * 0.1 * this.config.effectIntensity;
                    const scaleZ = this.config.height < 1 ? this.config.height : scale;
                    mesh.scale.set(scale, scale, scaleZ);
                });
                break;
            case 'glow':
                this.textMeshes.forEach((mesh, idx) => {
                    const glow = (Math.sin(time * this.config.effectSpeed) + 1) / 2 * this.config.effectIntensity;
                    mesh.material.emissiveIntensity = glow;
                });
                break;

        }
    }

    // Set effect with options
    setEffect(effectType, speed = 1.0, intensity = 1.0) {
        this.config.effectType = effectType;
        this.config.effectSpeed = speed;
        this.config.effectIntensity = intensity;
        this.effectType = effectType;

        // Reset material properties nhưng KHÔNG reset lại màu
        if (this.textMesh) {
            this.textMesh.material.opacity = 1;
            // Đã bỏ reset color và emissive
            this.textMesh.material.emissiveIntensity = this.config.emissiveIntensity;
            this.textMesh.scale.set(1, 1, 1);
        }
    }

    hide() {
        if (this.textGroup) {
            this.textGroup.visible = false;
            this.isHidden = true;
        }
    }
    show() {
        if (this.textGroup) {
            this.textGroup.visible = true;
            this.isHidden = false;
        }
    }

    // Hiệu ứng xuất hiện: fade in từ mờ đến tỏ dần rồi dừng
    showFadeInEffect(fullText, duration = 3500) {
        // Hiển thị text group
        this.textGroup.visible = true;
        this.isHidden = false;

        // Render toàn bộ text ngay lập tức nhưng với opacity = 0
        this.setText(fullText);

        // Set opacity = 0 cho tất cả mesh
            if (this.textMeshes) {
                this.textMeshes.forEach(mesh => {
                mesh.material.opacity = 0;
                });
            }

        // Bắt đầu hiệu ứng fade in
        this.fadeInStartTime = Date.now();
        this.fadeInDuration = duration;
    }

    // Hàm tạo mesh cho 1 dòng, dùng chung cho renderText3D và typewriter
    _createTextMesh(line, lineIdx) {
        if (!this.font) return null;
        const textGeometry = new TextGeometry(line, {
            font: this.font,
            size: this.config.size,
            height: this.config.height,
            curveSegments: this.config.curveSegments,
            bevelEnabled: this.config.bevelEnabled,
            bevelThickness: this.config.bevelThickness,
            bevelSize: this.config.bevelSize,
            bevelOffset: this.config.bevelOffset,
            bevelSegments: this.config.bevelSegments
        });
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        const textMaterial = new THREE.MeshStandardMaterial({
            color: this.config.color,
            metalness: this.config.metalness,
            roughness: this.config.roughness,
            emissive: this.config.emissiveColor,
            emissiveIntensity: this.config.emissiveIntensity,
            transparent: true
        });
        const mesh = new THREE.Mesh(textGeometry, textMaterial);
        mesh.position.set(
            this.config.position.x - textWidth / 2,
            this.config.position.y - lineIdx * this.config.size * 1.2,
            this.config.position.z
        );
        if (this.config.height < 1) {
            mesh.scale.z = this.config.height;
        }
        return mesh;
    }
}
