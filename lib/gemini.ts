import { GoogleGenAI, Type } from '@google/genai/web';

export async function analyzeImage(base64Image: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

  const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: 'Analyze this image and return a highly detailed structured JSON representation. Extract objects with bounding boxes (x, y, width, height as percentages 0-100), text blocks with content and styling, overall styles (lighting, tone, theme), and background details. Crucially, extract all visible text, quantities, prices, line items, dates, and any other relevant structured data into the "extracted_data" field. Do not include markdown formatting.',
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          canvas: {
            type: Type.OBJECT,
            properties: {
              width: { type: Type.NUMBER, description: 'Estimated original width' },
              height: { type: Type.NUMBER, description: 'Estimated original height' }
            }
          },
          background: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: 'e.g., solid, gradient, scene' },
              color: { type: Type.STRING, description: 'Dominant color hex' },
              description: { type: Type.STRING }
            }
          },
          objects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                attributes: {
                  type: Type.OBJECT,
                  properties: {
                    color: { type: Type.STRING },
                    material: { type: Type.STRING },
                    size: { type: Type.STRING }
                  }
                },
                bounding_box: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER }
                  }
                }
              }
            }
          },
          text_blocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                content: { type: Type.STRING },
                font_size: { type: Type.NUMBER },
                color: { type: Type.STRING },
                bounding_box: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER }
                  }
                }
              }
            }
          },
          styles: {
            type: Type.OBJECT,
            properties: {
              lighting: { type: Type.STRING },
              tone: { type: Type.STRING },
              theme: { type: Type.STRING }
            }
          },
          extracted_data: {
            type: Type.OBJECT,
            description: 'Extracted structured data from the image, such as receipt details, quantities, prices, dates, etc.',
            properties: {
              title: { type: Type.STRING, description: 'Main title or merchant name' },
              date: { type: Type.STRING, description: 'Date found on the document' },
              total_amount: { type: Type.NUMBER, description: 'Total amount or price' },
              tax_amount: { type: Type.NUMBER, description: 'Tax amount' },
              currency: { type: Type.STRING, description: 'Currency symbol or code' },
              items: {
                type: Type.ARRAY,
                description: 'List of line items, products, or services',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING, description: 'Item description or name' },
                    quantity: { type: Type.NUMBER, description: 'Quantity of the item' },
                    unit_price: { type: Type.NUMBER, description: 'Price per unit' },
                    total_price: { type: Type.NUMBER, description: 'Total price for this item' }
                  }
                }
              },
              additional_details: {
                type: Type.ARRAY,
                description: 'Any other key-value pairs extracted',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING }
                  }
                }
              },
              full_text: {
                type: Type.STRING,
                description: 'The complete extracted raw text from the image'
              }
            }
          }
        },
        required: ['background', 'objects', 'text_blocks', 'styles']
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) {
    throw new Error('No text returned from Gemini');
  }

  return JSON.parse(jsonText);
}

export function detectChanges(oldSchema: any, newSchema: any) {
  const changes: any[] = [];

  // Diff Objects
  if (oldSchema.objects && newSchema.objects) {
    newSchema.objects.forEach((newObj: any) => {
      const oldObj = oldSchema.objects.find((o: any) => o.id === newObj.id);
      if (oldObj) {
        if (newObj.type !== oldObj.type) {
          changes.push({ type: 'object_update', target: newObj.id, field: 'type', old: oldObj.type, new: newObj.type });
        }
        if (newObj.attributes && oldObj.attributes) {
          Object.keys(newObj.attributes).forEach(key => {
            if (newObj.attributes[key] !== oldObj.attributes[key]) {
              changes.push({ type: 'object_update', target: newObj.id, field: `attributes.${key}`, old: oldObj.attributes[key], new: newObj.attributes[key], objType: newObj.type });
            }
          });
        }
      }
    });
  }

  // Diff Text Blocks
  if (oldSchema.text_blocks && newSchema.text_blocks) {
    newSchema.text_blocks.forEach((newTxt: any) => {
      const oldTxt = oldSchema.text_blocks.find((t: any) => t.id === newTxt.id);
      if (oldTxt) {
        if (newTxt.content !== oldTxt.content) {
          changes.push({ type: 'text_update', target: newTxt.id, field: 'content', old: oldTxt.content, new: newTxt.content });
        }
        if (newTxt.color !== oldTxt.color) {
          changes.push({ type: 'text_update', target: newTxt.id, field: 'color', old: oldTxt.color, new: newTxt.color });
        }
      }
    });
  }

  // Diff Background
  if (oldSchema.background && newSchema.background) {
    if (oldSchema.background.type !== newSchema.background.type) {
      changes.push({ type: 'background_update', field: 'type', old: oldSchema.background.type, new: newSchema.background.type });
    }
    if (oldSchema.background.color !== newSchema.background.color) {
      changes.push({ type: 'background_update', field: 'color', old: oldSchema.background.color, new: newSchema.background.color });
    }
  }

  // Diff Styles
  if (oldSchema.styles && newSchema.styles) {
    Object.keys(newSchema.styles).forEach(key => {
      if (newSchema.styles[key] !== oldSchema.styles[key]) {
        changes.push({ type: 'style_update', field: key, old: oldSchema.styles[key], new: newSchema.styles[key] });
      }
    });
  }

  // Diff Extracted Data
  if (oldSchema.extracted_data && newSchema.extracted_data) {
    Object.keys(newSchema.extracted_data).forEach(key => {
      if (key !== 'items' && key !== 'additional_details') {
        if (newSchema.extracted_data[key] !== oldSchema.extracted_data[key]) {
          changes.push({ type: 'extracted_data_update', field: key, old: oldSchema.extracted_data[key], new: newSchema.extracted_data[key] });
        }
      }
    });

    if (oldSchema.extracted_data.items && newSchema.extracted_data.items) {
      newSchema.extracted_data.items.forEach((newItem: any, index: number) => {
        const oldItem = oldSchema.extracted_data.items[index];
        if (oldItem) {
          Object.keys(newItem).forEach(key => {
            if (newItem[key] !== oldItem[key]) {
              changes.push({ type: 'extracted_item_update', index, field: key, old: oldItem[key], new: newItem[key] });
            }
          });
        }
      });
    }
  }

  return changes;
}

export function buildPromptFromChanges(changes: any[]) {
  if (changes.length === 0) return null;

  let prompt = 'Edit the image precisely based on these instructions. ONLY modify the specified elements and PRESERVE everything else exactly as it is (background, other objects, faces, lighting).\n\nChanges:\n';
  
  changes.forEach(c => {
    if (c.type === 'object_update') {
      prompt += `- Change the ${c.field.replace('attributes.', '')} of the ${c.objType || 'object'} from "${c.old}" to "${c.new}".\n`;
    } else if (c.type === 'text_update') {
      prompt += `- Update the text content/style from "${c.old}" to "${c.new}".\n`;
    } else if (c.type === 'background_update') {
      prompt += `- Change the background ${c.field} from "${c.old}" to "${c.new}".\n`;
    } else if (c.type === 'style_update') {
      prompt += `- Adjust the overall ${c.field} from "${c.old}" to "${c.new}".\n`;
    } else if (c.type === 'extracted_data_update') {
      prompt += `- Update the extracted data field "${c.field}" from "${c.old}" to "${c.new}".\n`;
    } else if (c.type === 'extracted_item_update') {
      prompt += `- Update the extracted line item ${c.index + 1} field "${c.field}" from "${c.old}" to "${c.new}".\n`;
    }
  });

  prompt += '\nCRITICAL: Do not regenerate the full image. Use inpainting/masking conceptually to only alter the requested regions.';
  return prompt;
}

export async function editImage(image: string, oldSchema: any, newSchema: any) {
  const changes = detectChanges(oldSchema, newSchema);
  const prompt = buildPromptFromChanges(changes);

  if (!prompt) {
    return image; // No changes
  }

  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  let editedImageBase64 = null;
  let editedMimeType = 'image/png';

  const candidates = response.candidates;
  if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        editedImageBase64 = part.inlineData.data;
        if (part.inlineData.mimeType) {
          editedMimeType = part.inlineData.mimeType;
        }
        break;
      }
    }
  }

  if (!editedImageBase64) {
    throw new Error('No image returned from Gemini');
  }

  return `data:${editedMimeType};base64,${editedImageBase64}`;
}
