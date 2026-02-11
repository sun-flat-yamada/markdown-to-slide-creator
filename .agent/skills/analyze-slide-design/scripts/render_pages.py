import fitz
import sys
import argparse
import os

def render_pages(pdf_path, output_dir):
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Rendering pages from: {pdf_path}")
    print(f"Output directory: {output_dir}")

    # Render first 5 pages and last 2 pages as a sample
    # Plus any potential section dividers (often every 5-10 pages, let's just do a spread)
    pages_to_render = [0, 1, 2, 3, 4] + [i for i in range(10, len(doc), 10)] + [len(doc)-2, len(doc)-1]
    pages_to_render = sorted(list(set([p for p in pages_to_render if p < len(doc)])))

    for i in pages_to_render:
        page = doc[i]
        pix = page.get_pixmap(dpi=150)
        fname = os.path.join(output_dir, f'page_{i+1}.png')
        pix.save(fname)
        print(f'Saved page {i+1} to {fname}')

    doc.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Render key pages from PDF to PNG')
    parser.add_argument('pdf_path', help='Path to the PDF file')
    parser.add_argument('--output', '-o', help='Output directory for images', default='.')
    args = parser.parse_args()
    render_pages(args.pdf_path, args.output)
