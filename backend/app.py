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

# .env değişkenleri
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

reset_tokens = {}

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASS"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)


model = load_model("basecolour_model.h5")
class_names = [
    'Beige', 'Black', 'Blue', 'Bronze', 'Brown', 'Burgundy', 'Charcoal',
    'Coffee Brown', 'Copper', 'Cream', 'Fluorescent Green', 'Gold', 'Green',
    'Grey', 'Grey Melange', 'Khaki', 'Lavender', 'Magenta', 'Maroon',
    'Metallic', 'Multi', 'Mustard', 'Navy Blue', 'Off White', 'Olive',
    'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rust', 'Sea Green', 'Silver',
    'Skin', 'Steel', 'Tan', 'Taupe', 'Teal', 'Turquoise Blue', 'White', 'Yellow'
]

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
        reset_link = f"http://{request.host}/resetpassword.html?token={token}"

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
        style = data.get("style")
        usage = data.get("usage")
        category = data.get("subcategory")
        city = data.get("city")

        print("📥 Gelen veri:", data)

        if not all([email, style, usage, category, city]):
            return jsonify({"error": "Eksik parametre"}), 400

        cur = conn.cursor()
        cur.execute(
            "SELECT category, style, base_colour FROM wardrobe_items WHERE user_email = %s",
            (email,)
        )
        rows = cur.fetchall()
        cur.close()

        if not rows:
            return jsonify({"error": "Dolap boş."}), 400
        if len(rows) < 3:
            return jsonify({"error": "Dolabınızda yeterli kıyafet yok."}), 400

        wardrobe_text = "\n".join([
            f"- {row[0]} ({row[1]}, {row[2]})"
            for row in rows
        ])

        prompt = (
            f"Kullanıcı {style} stilinde giyinmek istiyor ve \"{usage}\" diyor.\n"
            f"Şehir: {city}\n"
            f"Dolap:\n{wardrobe_text}\n"
            f"Bu bilgilere göre bir tane en ideal kombin önerisi yap. Öneriyi her bir giysi türü için kısa açıklamalarla birlikte, detaylı bir şekilde sun. Her bir maddeyi 1-2 cümleyle açıkla. Cevabını sadece düz metin olarak, hiçbir şekilde kalın (bold) veya başka Markdown biçimlendirmesi (örn. **, #, -) kullanmadan ver. Toplamda 4-5 cümle civarında, akıcı ve bilgilendirici bir yanıt olsun."
        )

        print("🧠 Prompt:\n", prompt)

        suggestion = generate_outfit_suggestion(prompt)

        print("📬 Gemini yanıtı:\n", suggestion)

        return jsonify({"suggestion": suggestion})
    except Exception as e:
        print("❌ Backend hatası:", e)
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

# ------------------ Görsel Yükleme ------------------ #
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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

    ip = request.host.split(":")[0]
    port = request.host.split(":")[1] if ":" in request.host else "5001"

    return jsonify({
        'image_url': f'http://{ip}:{port}/uploads/{filename}'
    }), 200

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

        # Global conn kullanın (get_db_connection yerine)
        cur = conn.cursor()
        
        # Kullanıcı bilgilerini al
        cur.execute("SELECT name, surname, email FROM users WHERE email = %s", (email,))
        user_row = cur.fetchone()

        if not user_row:
            return jsonify({"message": "Kullanıcı bulunamadı."}), 404

        # Stil tercihini al
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
        
        print(f"[DEBUG] /update-profile - Gelen veri: {data}")

        email = data.get("email")
        name_new = data.get("name")
        surname_new = data.get("surname")
        style_new = data.get("style")

        if not email:
            return jsonify({"message": "Güncelleme için 'email' gereklidir."}), 400

        # Global conn kullan (get_db_connection yerine)
        cur = conn.cursor()

        # Önce kullanıcının var olup olmadığını kontrol et
        cur.execute("SELECT email FROM users WHERE email = %s", (email,))
        if not cur.fetchone():
            print(f"[DEBUG] /update-profile - Kullanıcı bulunamadı: {email}")
            return jsonify({"message": "Kullanıcı bulunamadı."}), 404

        # Users tablosunu güncelle (name, surname)
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
            
            print(f"[DEBUG] /update-profile - Users update query: {update_query}")
            print(f"[DEBUG] /update-profile - Update values: {update_values}")
            
            cur.execute(update_query, tuple(update_values))
            users_updated = cur.rowcount > 0

        # Stil tercihini güncelle
        style_updated = False
        if style_new is not None:
            # Mevcut tercihi kontrol et
            cur.execute("SELECT id FROM user_preferences WHERE user_email = %s ORDER BY id DESC LIMIT 1", (email,))
            existing_pref = cur.fetchone()
            
            if existing_pref:
                # Var olan tercihi güncelle
                cur.execute("UPDATE user_preferences SET style_preference = %s WHERE id = %s", 
                           (style_new, existing_pref[0]))
                style_updated = cur.rowcount > 0
                print(f"[DEBUG] /update-profile - Mevcut stil tercihi güncellendi: {style_new}")
            else:
                # Yeni tercih kaydı oluştur
                cur.execute("INSERT INTO user_preferences (user_email, style_preference, color_preference) VALUES (%s, %s, %s)", 
                           (email, style_new, None))
                style_updated = cur.rowcount > 0
                print(f"[DEBUG] /update-profile - Yeni stil tercihi eklendi: {style_new}")

        if not users_updated and not style_updated:
            return jsonify({"message": "Güncellenecek bilgi gönderilmedi veya değişiklik yapılmadı."}), 400

        # Değişiklikleri kaydet
        conn.commit()
        print(f"[DEBUG] /update-profile - Değişiklikler kaydedildi")

        # Güncellenmiş profil bilgilerini getir ve döndür
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
        
        print(f"[INFO] /update-profile - Profil güncellendi: {response_data}")
        return jsonify({
            "message": "Profil başarıyla güncellendi.",
            "updatedUser": response_data
        }), 200

    except psycopg2.Error as db_err:
        conn.rollback()
        print(f"!!! VERİTABANI HATASI (/update-profile) !!!")
        print(f"Error: {db_err}")
        return jsonify({"message": "Profil güncellenirken veritabanı hatası oluştu."}), 500
    except Exception as e:
        conn.rollback()
        print(f"!!! GENEL SUNUCU HATASI (/update-profile) !!!")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Profil güncellenirken beklenmedik bir hata oluştu."}), 500
    finally:
        if cur:
            cur.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
