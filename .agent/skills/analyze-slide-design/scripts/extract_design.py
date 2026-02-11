import fitz
import sys
import argparse
from collections import Counter

def analyze_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    print(f"Analyzing: {pdf_path}")
    print(f"Total pages: {len(doc)}")
    print(f"Page size: {doc[0].rect}")

    all_colors = Counter()
    all_fonts = Counter()

    for i in range(len(doc)):
        page = doc[i]
        blocks = page.get_text('dict')

        # Geometry / Drawings analysis
        drawings = page.get_drawings()
        if drawings:
            draw_colors = Counter()
            for d in drawings:
                if d.get('fill'):
                    c = d['fill']
                    hex_color = '#%02X%02X%02X' % (int(c[0]*255), int(c[1]*255), int(c[2]*255))
                    draw_colors[hex_color] += 1
                if d.get('color'):
                    c = d['color']
                    hex_color = '#%02X%02X%02X' % (int(c[0]*255), int(c[1]*255), int(c[2]*255))
                    draw_colors[hex_color] += 1

        # Text analysis
        for b in blocks['blocks']:
            if 'lines' in b:
                for l in b['lines']:
                    for s in l['spans']:
                        font = s['font']
                        color = '#%06X' % s['color']
                        text = s['text'].strip()
                        if text:
                            all_colors[color] += 1
                            all_fonts[font] += 1

    print(f"\n{'='*60}")
    print("=== GLOBAL STATISTICS ===")
    print(f"{'='*60}")
    print(f"\nTop Colors (Text + Shapes):")
    for c, n in all_colors.most_common(15):
        print(f"  {c}: {n} occurrences")

    print(f"\nTop Fonts:")
    for f, n in all_fonts.most_common(10):
        print(f"  {f}: {n} occurrences")

    doc.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract design patterns from PDF')
    parser.add_argument('pdf_path', help='Path to the PDF file')
    args = parser.parse_args()
    analyze_pdf(args.pdf_path)
