import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as zf:
            xml_content = zf.read('word/document.xml')
        
        tree = ET.fromstring(xml_content)
        namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text = []
        for node in tree.iter():
            if node.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t':
                if node.text:
                    text.append(node.text)
            elif node.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p':
                text.append('\n')
        
        return ''.join(text)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    text = extract_text_from_docx("Readstar Specification.docx")
    with open("spec_text.txt", "w", encoding="utf-8") as f:
        f.write(text)
