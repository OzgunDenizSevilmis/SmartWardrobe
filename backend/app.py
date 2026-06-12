from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import smtplib
from email.mime.text import MIMEText
from uuid import uuid4
import os
from dotenv import load_dotenv
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model
from gemini_api_request import generate_outfit_suggestion, get_weather_info
import socket # IP tespiti için eklendi
import random


# .env değişkenleri
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- OTOMATİK IP TESPİT FONKSİYONU ---
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Google DNS'e bağlanmaya çalışarak (bağlanmasa bile) local IP'yi öğrenir
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

# Başlangıçta IP'yi otomatik bul ve kaydet
CURRENT_IP = get_local_ip()
CURRENT_PORT = "5001"

print(f"\n==================================================")
print(f"✅ SUNUCU BU IP'DE ÇALIŞIYOR: http://{CURRENT_IP}:{CURRENT_PORT}")
print(f"⚠️  Frontend (Mobil) config dosyanı bu IP ile güncellemeyi unutma!")
print(f"==================================================\n")

reset_tokens = {}

# Veritabanı Bağlantısı
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASS"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)

# Renk Modeli Yükleme
try:
    model = load_model("basecolour_model.h5")
except Exception as e:
    print("Model yüklenemedi, renk tahmini çalışmayabilir:", e)

class_names = [
    'Beige', 'Black', 'Blue', 'Bronze', 'Brown', 'Burgundy', 'Charcoal',
    'Coffee Brown', 'Copper', 'Cream', 'Fluorescent Green', 'Gold', 'Green',
    'Grey', 'Grey Melange', 'Khaki', 'Lavender', 'Magenta', 'Maroon',
    'Metallic', 'Multi', 'Mustard', 'Navy Blue', 'Off White', 'Olive',
    'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rust', 'Sea Green', 'Silver',
    'Skin', 'Steel', 'Tan', 'Taupe', 'Teal', 'Turquoise Blue', 'White', 'Yellow'
]

# Klasör Ayarı
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ------------------ ENDPOINTS ------------------ #

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        name, surname = data.get("name"), data.get("surname")
        email, password = data.get("email"), data.get("password")

        if not all([name, surname, email, password]):
            return jsonify({"message": "Tüm alanlar doldurulmalıdır."}), 400

        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            return jsonify({"message": "Bu e-posta zaten kayıtlı."}), 400

        cur.execute(
            "INSERT INTO users (name, surname, email, password) VALUES (%s, %s, %s, %s)",
            (name, surname, email, password)
        )
        conn.commit()
        cur.close()
        return jsonify({"message": "Kayıt başarılı!"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Kayıt sırasında hata oluştu: {str(e)}"}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        cur = conn.cursor()
        cur.execute("SELECT name, surname, password FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
        cur.close()

        if row and password == row[2]:
            return jsonify({
                "message": "Giriş başarılı!",
                "user": {
                    "name": row[0],
                    "surname": row[1],
                    "email": email
                }
            }), 200
        else:
            return jsonify({"message": "E-posta veya şifre hatalı."}), 401

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Giriş sırasında hata oluştu: {str(e)}"}), 500

@app.route("/password-reset", methods=["POST"])
def password_reset():
    try:
        data = request.get_json()
        email = data.get("email")
        if not email:
            return jsonify({"message": "E-posta adresi gereklidir."}), 400

        token = uuid4().hex
        reset_tokens[token] = email
        
        # Link dinamik IP ile oluşturulur
        reset_link = f"http://{CURRENT_IP}:{CURRENT_PORT}/resetpassword.html?token={token}"

        sender = os.getenv("EMAIL_ADRESS")
        password = os.getenv("EMAIL_PASSWORD")

        msg = MIMEText(
            f"Merhaba,\n\nŞifrenizi sıfırlamak için bu bağlantıya tıklayın:\n{reset_link}\n\nOutfitApp Ekibi"
        )
        msg["Subject"] = "OutfitApp Şifre Sıfırlama"
        msg["From"] = sender
        msg["To"] = email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.send_message(msg)

        return jsonify({"message": "Şifre sıfırlama e-postası gönderildi."}), 200

    except Exception as e:
        return jsonify({"message": "E-posta gönderilemedi: " + str(e)}), 500

@app.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
        token = data.get("token")
        new_pass = data.get("password")
        email = reset_tokens.get(token)
        if not email:
            return jsonify({"message": "Geçersiz token."}), 400

        cur = conn.cursor()
        cur.execute("UPDATE users SET password = %s WHERE email = %s", (new_pass, email))
        conn.commit()
        cur.close()
        reset_tokens.pop(token)

        return jsonify({"message": "Şifre güncellendi."})
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Hata oluştu: {str(e)}"}), 500

@app.route("/save-preferences", methods=["POST"])
def save_preferences():
    try:
        data = request.get_json()
        email = data.get("email")
        style = data.get("style")
        color = data.get("color")
        wardrobe = data.get("wardrobe")

        if not all([email, style, color, wardrobe]):
            return jsonify({"message": "Tüm alanlar zorunludur."}), 400

        cur = conn.cursor()
        cur.execute(
            "INSERT INTO user_preferences (user_email, style_preference, color_preference, wardrobe_items) VALUES (%s, %s, %s, %s)",
            (email, style, color, wardrobe)
        )
        conn.commit()
        cur.close()

        return jsonify({"message": "Tercihler kaydedildi."}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": "Bir hata oluştu: " + str(e)}), 500

@app.route("/get-preferences", methods=["GET"])
def get_preferences():
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"message": "E-posta gerekli."}), 400

        cur = conn.cursor()
        cur.execute(
            "SELECT style_preference, color_preference, wardrobe_items FROM user_preferences WHERE user_email = %s ORDER BY created_at DESC LIMIT 1",
            (email,)
        )
        result = cur.fetchone()
        cur.close()

        if result:
            style, color, wardrobe = result
            return jsonify({
                "style": style,
                "color": color,
                "wardrobe": wardrobe
            })
        else:
            return jsonify({"message": "Tercih bulunamadı."}), 404

    except Exception as e:
        return jsonify({"message": "Hata oluştu: " + str(e)}), 500

@app.route("/predict-colour", methods=["POST"])
def predict_colour():
    if 'image' not in request.files:
        return jsonify({"error": "Görsel dosyası gerekli."}), 400
    try:
        image = Image.open(request.files['image']).convert("RGB")
        image = image.resize((224, 224))
        image_array = np.expand_dims(np.array(image) / 255.0, axis=0)

        prediction = model.predict(image_array)
        predicted = class_names[np.argmax(prediction)]
        return jsonify({"baseColour": predicted})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate-outfit", methods=["POST"])
def generate_outfit():
    try:
        data = request.get_json()
        email = data.get("email")
        style_request = data.get("style") # Örn: Spor, Klasik
        usage = data.get("usage", "").lower() # Örn: iş görüşmesi, halı saha
        city = data.get("city")

        if not all([email, style_request, usage, city]):
            return jsonify({"error": "Eksik parametre"}), 400

        cur = conn.cursor()
        cur.execute(
            "SELECT category, style, base_colour, image_uri FROM wardrobe_items WHERE user_email = %s",
            (email,)
        )
        rows = cur.fetchall()
        cur.close()

        if not rows:
            return jsonify({"error": "Dolap boş."}), 400
        
        # --- 1. VERİLERİ HAZIRLA ---
        all_items = []
        for row in rows:
            cat, item_style, color, url = row
            
            # URL Düzeltme (Telefonda görünsün diye)
            if url and ('localhost' in url or '127.0.0.1' in url):
                url = url.replace('localhost', CURRENT_IP).replace('127.0.0.1', CURRENT_IP)
                if ':5000' in url and CURRENT_PORT == '5001':
                    url = url.replace(':5000', ':5001')
            
            all_items.append({
                "desc": f"{color} {cat} ({item_style})", 
                "url": url, 
                "category": cat, 
                "style": item_style,
                "color": color
            })

        # --- 2. MANTIK MOTORU (Event Rules) ---
        # Burada "Nereye gidiyorsun?" cevabına göre Yasaklar ve Zorunluluklar belirliyoruz.
        
        forbidden_colors = []      # Asla seçilmeyecek renkler
        forbidden_categories = []  # Asla seçilmeyecek türler (örn: iş için şort)
        preferred_styles = []      # Öncelikli stiller
        
        # SENARYO A: İŞ GÖRÜŞMESİ / CİDDİ ORTAM
        if any(x in usage for x in ['iş', 'mülakat', 'ofis', 'toplantı', 'resmi', 'sunum']):
            forbidden_colors = ['Green', 'Red', 'Orange', 'Yellow', 'Pink', 'Purple', 'Gold', 'Fluorescent Green']
            forbidden_categories = ['Şort', 'Eşofman', 'Terlik', 'Sandalet', 'Hoodie', 'Sweatshirt', 'Jogger']
            preferred_styles = ['Resmi', 'Klasik', 'Basic']
            print("LOGIC: İş Modu Aktif - Cırtlak renkler ve şortlar yasaklandı.")

        # SENARYO B: SPOR / YÜRÜYÜŞ
        elif any(x in usage for x in ['spor', 'yürüyüş', 'koşu', 'gym', 'antrenman']):
            forbidden_categories = ['Gömlek', 'Bot', 'Topuklu', 'Klasik Ayakkabı', 'Blazer']
            preferred_styles = ['Spor', 'Sokak']
            print("LOGIC: Spor Modu Aktif - Gömlekler yasaklandı.")

        # --- 3. FİLTRELEME FONKSİYONU ---
        def is_item_allowed(item):
            # 1. Renk Yasağı Kontrolü
            if item['color'] in forbidden_colors:
                return False
            # 2. Kategori Yasağı Kontrolü
            # (Veritabanındaki kategori isminin içinde yasaklı kelime geçiyor mu?)
            if any(bad_cat.lower() in item['category'].lower() for bad_cat in forbidden_categories):
                return False
            return True

        # Kurallara uyanları ayıkla
        allowed_items = [i for i in all_items if is_item_allowed(i)]
        
        # Eğer kurallar çok sıkıysa ve hiç eşya kalmadıysa, kuralları gevşet (Yedek Plan)
        if len(allowed_items) < 2:
            allowed_items = all_items 
            print("UYARI: Kurallar çok sıkıydı, dolapta uygun parça yok. Filtreler kaldırıldı.")

        # --- 4. KATEGORİLERE AYIRMA ---
        tops = []
        bottoms = []
        shoes = []
        accessories = []

        top_keywords = ['T-shirt', 'Gömlek', 'Kazak', 'Hırka', 'Ceket', 'Mont', 'Sweatshirt', 'Büstiyer', 'Bluz', 'Hoodie', 'Üst']
        bottom_keywords = ['Pantolon', 'Şort', 'Eşofman', 'Etek', 'Tayt', 'Jean', 'Alt']
        shoe_keywords = ['Ayakkabı', 'Spor', 'Bot', 'Çizme', 'Sandalet', 'Terlik']
        accessory_keywords = ['Aksesuar', 'Saat', 'Gözlük', 'Kolye', 'Şapka', 'Çanta']

        for item in allowed_items:
            cat = item['category']
            if any(k in cat for k in top_keywords): tops.append(item)
            elif any(k in cat for k in bottom_keywords): bottoms.append(item)
            elif any(k in cat for k in shoe_keywords): shoes.append(item)
            elif any(k in cat for k in accessory_keywords): accessories.append(item)

        # --- 5. TERCİHLİ STİL SEÇİMİ (Soft Priority) ---
        # Eğer "İş" dediysek, öncelikle "Resmi" etiketli olanlardan seçmeye çalış
        def pick_best(item_list):
            if not item_list: return None
            # Tercih edilen stillerden biri var mı?
            preferred = [i for i in item_list if any(s.lower() in i['style'].lower() for s in preferred_styles)]
            if preferred:
                return random.choice(preferred) # Varsa onlardan seç
            return random.choice(item_list)     # Yoksa kalanlardan seç

        selected_top = pick_best(tops)
        selected_bottom = pick_best(bottoms)
        selected_shoes = pick_best(shoes)
        selected_accessory = random.choice(accessories) if accessories else None

        if not selected_top and not selected_bottom:
             return jsonify({"error": "Uygun parça bulunamadı."}), 400

        # --- 6. PROMPT ---
        selected_items_text = []
        if selected_top: selected_items_text.append(f"Üst: {selected_top['desc']}")
        if selected_bottom: selected_items_text.append(f"Alt: {selected_bottom['desc']}")
        if selected_shoes: selected_items_text.append(f"Ayakkabı: {selected_shoes['desc']}")
        if selected_accessory: selected_items_text.append(f"Aksesuar: {selected_accessory['desc']}")

        selection_summary = ", ".join(selected_items_text)

        prompt = (
            f"Sen profesyonel bir imaj danışmanısın. Kullanıcı şu etkinliğe gidiyor: \"{usage}\".\n"
            f"Bu ciddiyete/duruma uygun olarak dolabından şu parçaları özenle seçtik: {selection_summary}.\n"
            f"Lütfen bu parçaların neden bu etkinlik için ({usage}) doğru tercih olduğunu, renklerin psikolojik etkisini veya stilin uygunluğunu vurgulayarak anlat.\n"
            f"Ayrıca kullanıcıya etkinlik için profesyonel bir duruş tüyosu ver.\n"
            f"Cevabın Türkçe, samimi ama profesyonel, kısa (max 3 cümle) olsun."
        )

        print("🧠 Prompt:\n", prompt)
        suggestion_text = generate_outfit_suggestion(prompt)
        print("📬 Gemini yanıtı:\n", suggestion_text)

        response_data = {
            "suggestion": suggestion_text,
            "outfit_images": {
                "top": selected_top['url'] if selected_top else None,
                "bottom": selected_bottom['url'] if selected_bottom else None,
                "shoes": selected_shoes['url'] if selected_shoes else None
            }
        }

        return jsonify(response_data)

    except Exception as e:
        print("❌ Hata:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/add-wardrobe-item", methods=["POST"])
def add_wardrobe_item():
    try:
        data = request.get_json()
        email = data.get("email")
        image_uri = data.get("image")
        category = data.get("category")
        style = data.get("style")
        base_colour = data.get("baseColour")

        if not all([email, image_uri, category, style, base_colour]):
            return jsonify({"message": "Tüm alanlar zorunludur."}), 400

        cur = conn.cursor()
        cur.execute(
            "INSERT INTO wardrobe_items (user_email, image_uri, category, style, base_colour) VALUES (%s, %s, %s, %s, %s)",
            (email, image_uri, category, style, base_colour)
        )
        conn.commit()
        cur.close()

        return jsonify({"message": "Kıyafet dolaba eklendi."}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"message": "Bir hata oluştu: " + str(e)}), 500

@app.route("/get-wardrobe", methods=["GET"])
def get_wardrobe():
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"message": "E-posta gerekli."}), 400

        cur = conn.cursor()
        cur.execute(
            "SELECT image_uri, category, style, base_colour FROM wardrobe_items WHERE user_email = %s",
            (email,)
        )
        rows = cur.fetchall()
        cur.close()

        items = [
            {"image_url": r[0], "category": r[1], "style": r[2], "base_color": r[3]}
            for r in rows
        ]
        return jsonify({"items": items}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------ GÖRSEL YÜKLEME VE SUNMA (KRİTİK) ------------------ #

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'message': 'Görsel bulunamadı'}), 400

    file = request.files['image']
    extension = 'jpg'
    if '.' in file.filename:
        extension = file.filename.rsplit('.', 1)[1].lower()

    filename = f"{uuid4().hex}.{extension}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # DİNAMİK IP KULLANIMI:
    # Artık IP değişse bile backend kendi IP'sini otomatik algılayıp koyacak.
    image_url = f'http://{CURRENT_IP}:{CURRENT_PORT}/uploads/{filename}'

    print(f"✅ Yeni resim yüklendi: {image_url}")

    return jsonify({
        'image_url': image_url
    }), 200

# Bu fonksiyonun olması ŞART, resimleri bu endpoint sunuyor
@app.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/delete-wardrobe-item", methods=["POST"])
def delete_wardrobe_item():
    try:
        data = request.get_json()
        email = data.get("email")
        image_url = data.get("image")

        if not all([email, image_url]):
            return jsonify({"message": "Eksik bilgi"}), 400

        cur = conn.cursor()
        cur.execute(
            "DELETE FROM wardrobe_items WHERE user_email = %s AND image_uri = %s",
            (email, image_url)
        )
        conn.commit()
        cur.close()

        return jsonify({"message": "Kıyafet silindi"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Hata: {str(e)}"}), 500

@app.route("/profile", methods=["POST"])
def get_profile():
    cur = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"message": "İstek gövdesi boş."}), 400
            
        email = data.get("email")
        if not email:
            return jsonify({"message": "Email gerekli."}), 400

        cur = conn.cursor()
        
        cur.execute("SELECT name, surname, email FROM users WHERE email = %s", (email,))
        user_row = cur.fetchone()

        if not user_row:
            return jsonify({"message": "Kullanıcı bulunamadı."}), 404

        cur.execute(
            "SELECT style_preference FROM user_preferences WHERE user_email = %s ORDER BY id DESC LIMIT 1",
            (email,)
        )
        style_row = cur.fetchone()

        return jsonify({
            "email": email,
            "name": user_row[0] or "",
            "surname": user_row[1] or "",
            "style": style_row[0] if style_row and style_row[0] else "Tanımsız"
        }), 200

    except Exception as e:
        print(f"[ERROR] /profile - Hata: {str(e)}")
        return jsonify({"message": f"Profil alınamadı: {str(e)}"}), 500
    finally:
        if cur:
            cur.close()

@app.route("/update-profile", methods=["POST"])
def update_user_profile_info():
    cur = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"message": "İstek gövdesi boş veya JSON formatında değil."}), 400
        
        email = data.get("email")
        name_new = data.get("name")
        surname_new = data.get("surname")
        style_new = data.get("style")

        if not email:
            return jsonify({"message": "Güncelleme için 'email' gereklidir."}), 400

        cur = conn.cursor()

        cur.execute("SELECT email FROM users WHERE email = %s", (email,))
        if not cur.fetchone():
            return jsonify({"message": "Kullanıcı bulunamadı."}), 404

        users_updated = False
        if name_new is not None or surname_new is not None:
            update_fields = []
            update_values = []
            
            if name_new is not None:
                update_fields.append("name = %s")
                update_values.append(name_new)
            if surname_new is not None:
                update_fields.append("surname = %s")
                update_values.append(surname_new)
            
            update_values.append(email)
            update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE email = %s"
            
            cur.execute(update_query, tuple(update_values))
            users_updated = cur.rowcount > 0

        style_updated = False
        if style_new is not None:
            cur.execute("SELECT id FROM user_preferences WHERE user_email = %s ORDER BY id DESC LIMIT 1", (email,))
            existing_pref = cur.fetchone()
            
            if existing_pref:
                cur.execute("UPDATE user_preferences SET style_preference = %s WHERE id = %s", 
                           (style_new, existing_pref[0]))
                style_updated = cur.rowcount > 0
            else:
                cur.execute("INSERT INTO user_preferences (user_email, style_preference, color_preference) VALUES (%s, %s, %s)", 
                           (email, style_new, None))
                style_updated = cur.rowcount > 0

        if not users_updated and not style_updated:
            return jsonify({"message": "Güncellenecek bilgi gönderilmedi veya değişiklik yapılmadı."}), 400

        conn.commit()

        cur.execute("SELECT name, surname FROM users WHERE email = %s", (email,))
        updated_user = cur.fetchone()
        
        cur.execute("SELECT style_preference FROM user_preferences WHERE user_email = %s ORDER BY id DESC LIMIT 1", (email,))
        updated_style = cur.fetchone()
        
        response_data = {
            "email": email,
            "name": updated_user[0] if updated_user and updated_user[0] else "",
            "surname": updated_user[1] if updated_user and updated_user[1] else "",
            "style": updated_style[0] if updated_style and updated_style[0] else "Tanımsız"
        }
        
        return jsonify({
            "message": "Profil başarıyla güncellendi.",
            "updatedUser": response_data
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"!!! GÜNCELLEME HATASI !!!: {str(e)}")
        return jsonify({"message": "Profil güncellenirken hata oluştu."}), 500
    finally:
        if cur:
            cur.close()

# Uygulamayı dışa açmak için host='0.0.0.0' önemli
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(CURRENT_PORT), debug=True)