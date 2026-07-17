"""Üretilen sunumu (GeneratedPresentation) düzenlenebilir bir .pptx dosyasına
çevirir — PNG değil, kullanıcının kendi PowerPoint'inde düzenleyebileceği
gerçek slaytlar (python-pptx ile üretilen native metin kutuları)."""
import io

from pptx import Presentation
from pptx.util import Pt

from ..models.presentation import GeneratedPresentation

_TITLE_LAYOUT = 0
_CONTENT_LAYOUT = 1


def build_presentation_pptx(presentation: GeneratedPresentation) -> bytes:
    prs = Presentation()

    title_slide = prs.slides.add_slide(prs.slide_layouts[_TITLE_LAYOUT])
    title_slide.shapes.title.text = presentation.title
    if presentation.subtitle and len(title_slide.placeholders) > 1:
        title_slide.placeholders[1].text = presentation.subtitle

    for slide_data in presentation.slides:
        slide = prs.slides.add_slide(prs.slide_layouts[_CONTENT_LAYOUT])
        slide.shapes.title.text = slide_data.heading

        body = slide.placeholders[1].text_frame
        body.clear()
        for i, bullet in enumerate(slide_data.bullets):
            p = body.paragraphs[0] if i == 0 else body.add_paragraph()
            p.text = bullet
            p.level = 0
            for run in p.runs:
                run.font.size = Pt(18)

    buffer = io.BytesIO()
    prs.save(buffer)
    return buffer.getvalue()
