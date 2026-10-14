# GoalMetric AI - Python Statistical Microservice

Layanan mikro Python independen untuk komputasi statistik tingkat lanjut:
- **Model Matematika**: Bivariate Poisson dengan koreksi Dixon-Coles (1997) dan penyesuaian korelasi skor rendah $(\rho = -0.11)$.
- **Integrasi xG**: Pembobotan kekuatan serang dan bertahan berdasarkan Expected Goals (xG).
- **Framework**: FastAPI + Pydantic + NumPy + SciPy.

## Panduan Instalasi & Menjalankan

### 1. Buat Virtual Environment
```bash
cd python-engine
python3 -m venv venv
source venv/bin/activate  # Di Linux/macOS
# atau venv\Scripts\activate di Windows
```

### 2. Pasang Dependencies
```bash
pip install -r requirements.txt
```

### 3. Jalankan Pengujian
```bash
python test_engine.py
```

### 4. Jalankan Microservice
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Dokumentasi OpenAPI interaktif dapat diakses di `http://localhost:8000/docs`.

### 5. Integrasikan dengan Node.js Backend
Di file `.env` root aplikasi:
```env
PYTHON_ENGINE_ENABLED=true
PYTHON_ENGINE_URL=http://localhost:8000
```
Jika layanan mikro Python tidak aktif atau gagal dihubungi, backend TypeScript GoalMetric secara otomatis dan mulus beralih (*graceful fallback*) ke mesin Poisson bawaan TypeScript tanpa menghentikan sistem.
