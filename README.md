# GEN-UNDOX

## Klasör Yapısı

```
gen-undox/
├── index.html
├── manifest.json        ← Her dosyayı buraya ekle
├── vercel.json
└── assets/
    ├── false/
    │   ├── 0-background/    ← *.png
    │   ├── 1-frame/         ← *.png
    │   ├── 2-accessories/   ← *.png
    │   ├── 3-body/          ← *.png
    │   ├── 4-head/          ← *.png
    │   ├── 5-nose/          ← *.png
    │   ├── 6-line/          ← *.png
    │   ├── 7-mouth/         ← *.png
    │   └── 8-eyes/          ← *.png
    ├── not-false/           ← aynı yapı
    ├── not-true/            ← aynı yapı
    └── true/                ← aynı yapı
```

## manifest.json Güncelleme

Her yeni PNG eklenince manifest.json içindeki ilgili diziye dosya yolunu ekle:

```json
"1": ["assets/false/1-frame/X.png", "assets/false/1-frame/VI.png", "assets/false/1-frame/YENI.png"]
```

## Deploy

```bash
# GitHub'a yükle → Vercel otomatik deploy eder
```
