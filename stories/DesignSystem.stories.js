/**
 * Design System documentation for Lightning Talk
 */

export default {
  title: 'Lightning Talk/Design System',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Design system documentation including colors, typography, and spacing'
      }
    }
  }
};

export const Colors = () => {
  const container = document.createElement('div');
  container.style.padding = '40px';
  container.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
  
  container.innerHTML = `
    <h1 style="color: #333; margin-bottom: 40px;">🌈 Lightning Talk Design System</h1>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">🎨 Color Palette</h2>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #333; margin-bottom: 20px;">Primary Colors</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="color-swatch">
            <div class="color-sample" style="background: linear-gradient(45deg, #FF6B6B, #FFD93D);"></div>
            <h4>Primary Gradient</h4>
            <p>#FF6B6B → #FFD93D</p>
            <small>Used for buttons, highlights, CTAs</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: #FFD700;"></div>
            <h4>Gold</h4>
            <p>#FFD700</p>
            <small>Accent color, highlights, borders</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: #4169E1;"></div>
            <h4>Royal Blue</h4>
            <p>#4169E1</p>
            <small>Links, secondary elements</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #333; margin-bottom: 20px;">Background Gradients</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="color-swatch">
            <div class="color-sample" style="background: linear-gradient(135deg, #87CEEB 0%, #4169E1 100%);"></div>
            <h4>Hero Background</h4>
            <p>#87CEEB → #4169E1</p>
            <small>Main hero section</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: linear-gradient(45deg, #fff, #f0f8ff);"></div>
            <h4>Event Section</h4>
            <p>#FFFFFF → #F0F8FF</p>
            <small>Event information section</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
            <h4>About Section</h4>
            <p>#667EEA → #764BA2</p>
            <small>About lightning talk section</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%);"></div>
            <h4>Participation Section</h4>
            <p>#FF9A9E → #FECFEF</p>
            <small>Participation section</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #333; margin-bottom: 20px;">Neutral Colors</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="color-swatch">
            <div class="color-sample" style="background: #333;"></div>
            <h4>Dark Gray</h4>
            <p>#333333</p>
            <small>Primary text, headings</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: #666;"></div>
            <h4>Medium Gray</h4>
            <p>#666666</p>
            <small>Secondary text, descriptions</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: #f8f9fa;"></div>
            <h4>Light Gray</h4>
            <p>#F8F9FA</p>
            <small>Background, subtle sections</small>
          </div>
          
          <div class="color-swatch">
            <div class="color-sample" style="background: #ffffff; border: 1px solid #ddd;"></div>
            <h4>White</h4>
            <p>#FFFFFF</p>
            <small>Card backgrounds, text on dark</small>
          </div>
        </div>
      </div>
    </section>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">📝 Typography</h2>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Font Family</h3>
        <p style="font-size: 1.1rem; color: #666;">Primary: "Helvetica Neue", Arial, sans-serif</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Headings</h3>
        <h1 style="color: #333; margin: 10px 0;">H1 Hero Title (4rem / 64px)</h1>
        <h2 style="color: #333; margin: 10px 0;">H2 Section Title (2.5rem / 40px)</h2>
        <h3 style="color: #333; margin: 10px 0;">H3 Subsection (1.5rem / 24px)</h3>
        <h4 style="color: #333; margin: 10px 0;">H4 Card Title (1.2rem / 19px)</h4>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Body Text</h3>
        <p style="font-size: 1.2rem; color: #333; margin: 10px 0;">Large body text (1.2rem / 19px) - Used for hero descriptions</p>
        <p style="font-size: 1rem; color: #666; margin: 10px 0;">Regular body text (1rem / 16px) - Default paragraph text</p>
        <p style="font-size: 0.9rem; color: #888; margin: 10px 0;"><em>Small text (0.9rem / 14px) - Used for notes and captions</em></p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Button Text</h3>
        <button class="btn" style="margin: 5px;">Regular Button (1.1rem / 18px)</button>
        <button class="btn btn-small" style="margin: 5px;">Small Button (0.9rem / 14px)</button>
        <button class="btn btn-large" style="margin: 5px;">Large Button (1.3rem / 21px)</button>
      </div>
    </section>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">📏 Spacing & Layout</h2>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Container & Padding</h3>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <p><strong>Container Max Width:</strong> 1200px</p>
          <p><strong>Container Padding:</strong> 0 20px (mobile: 0 15px)</p>
          <p><strong>Section Padding:</strong> 80px 0 (mobile: 40px 0)</p>
          <p><strong>Card Padding:</strong> 40px (mobile: 20px)</p>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Border Radius</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
            <strong>Small:</strong> 10px<br>
            <small>Form inputs, small cards</small>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 20px;">
            <strong>Medium:</strong> 20px<br>
            <small>Cards, modals</small>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 50px;">
            <strong>Large:</strong> 50px<br>
            <small>Buttons, pills</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Grid Systems</h3>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <p><strong>Topic Grid:</strong> repeat(auto-fit, minmax(250px, 1fr))</p>
          <p><strong>Participation Grid:</strong> repeat(auto-fit, minmax(300px, 1fr))</p>
          <p><strong>Benefits Grid:</strong> repeat(auto-fit, minmax(200px, 1fr))</p>
        </div>
      </div>
    </section>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">✨ Effects & Animations</h2>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Box Shadows</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
            <strong>Button Shadow</strong><br>
            <small>0 10px 20px rgba(0,0,0,0.2)</small>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
            <strong>Card Shadow</strong><br>
            <small>0 20px 40px rgba(0,0,0,0.1)</small>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 20px;">Transitions</h3>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <p><strong>Standard:</strong> all 0.3s ease</p>
          <p><strong>Fade In:</strong> all 0.6s ease</p>
          <p><strong>Modal:</strong> 0.3s ease</p>
        </div>
      </div>
    </section>
  `;
  
  return container;
};

export const ComponentStates = () => {
  const container = document.createElement('div');
  container.style.padding = '40px';
  container.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
  
  container.innerHTML = `
    <h1 style="color: #333; margin-bottom: 40px;">🔄 Component States</h1>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">Button States</h2>
      <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
        <button class="btn">Default</button>
        <button class="btn" style="transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.3);">Hover</button>
        <button class="btn btn-disabled" disabled>Disabled</button>
        <button class="btn survey-btn">Survey Button</button>
      </div>
    </section>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">Topic Item States</h2>
      <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <div class="topic-item">Default</div>
        <div class="topic-item" style="background: linear-gradient(45deg, #FFD93D, #FF6B6B); color: #fff; transform: translateY(-2px);">Hover</div>
        <div class="topic-item selected">Selected</div>
      </div>
    </section>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">Card States</h2>
      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="background: white; padding: 20px; border-radius: 20px; border: 3px solid transparent; box-shadow: 0 15px 30px rgba(0,0,0,0.1); width: 200px;">
          <h4>Default Card</h4>
          <p>Normal state</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 20px; border: 3px solid #FF6B6B; box-shadow: 0 25px 50px rgba(0,0,0,0.2); transform: translateY(-10px); width: 200px;">
          <h4>Hover Card</h4>
          <p>Elevated state</p>
        </div>
      </div>
    </section>
  `;
  
  return container;
};

export const Iconography = () => {
  const container = document.createElement('div');
  container.style.padding = '40px';
  container.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
  
  container.innerHTML = `
    <h1 style="color: #333; margin-bottom: 40px;">🎯 Iconography</h1>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">Core Icons</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">⚡</div>
          <strong>Lightning</strong><br>
          <small>Lightning Talk, Energy</small>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">🎤</div>
          <strong>Microphone</strong><br>
          <small>Speaking, Presentation</small>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">👥</div>
          <strong>People</strong><br>
          <small>Audience, Community</small>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">📝</div>
          <strong>Registration</strong><br>
          <small>Sign up, Forms</small>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">💻</div>
          <strong>Online</strong><br>
          <small>Virtual participation</small>
        </div>
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">🏢</div>
          <strong>Venue</strong><br>
          <small>Physical location</small>
        </div>
      </div>
    </section>
    
    <section style="margin-bottom: 50px;">
      <h2 style="color: #333; margin-bottom: 30px;">Category Icons</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">💻</div>
          <small>Tech</small>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">🎨</div>
          <small>Hobby</small>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">📚</div>
          <small>Learning</small>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">🌍</div>
          <small>Travel</small>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">🍳</div>
          <small>Food</small>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">🎮</div>
          <small>Game</small>
        </div>
      </div>
    </section>
  `;
  
  return container;
};

// Design system styles
const designSystemCSS = `
  .color-swatch {
    text-align: center;
    margin-bottom: 20px;
    min-width: 150px;
  }
  
  .color-sample {
    width: 100px;
    height: 100px;
    border-radius: 10px;
    margin: 0 auto 10px;
    border: 1px solid #ddd;
  }
  
  .color-swatch h4 {
    margin: 10px 0 5px;
    color: #333;
    font-size: 1rem;
  }
  
  .color-swatch p {
    margin: 5px 0;
    color: #666;
    font-family: monospace;
    font-size: 0.9rem;
  }
  
  .color-swatch small {
    color: #888;
    font-size: 0.8rem;
  }
  
  .btn {
    display: inline-block;
    padding: 15px 30px;
    background: linear-gradient(45deg, #FF6B6B, #FFD93D);
    color: #fff;
    text-decoration: none;
    border-radius: 50px;
    font-weight: bold;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }
  
  .btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  }
  
  .btn-disabled {
    background: #ccc !important;
    cursor: not-allowed !important;
    opacity: 0.6;
  }
  
  .btn-disabled:hover {
    transform: none !important;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2) !important;
  }
  
  .btn-small {
    padding: 8px 16px !important;
    font-size: 0.9rem !important;
  }
  
  .btn-large {
    padding: 20px 40px !important;
    font-size: 1.3rem !important;
  }
  
  .survey-btn {
    position: relative;
    min-width: 160px;
  }
  
  .topic-item {
    padding: 10px 15px;
    background: linear-gradient(45deg, #f8f9fa, #e9ecef);
    border-radius: 10px;
    border: 2px solid #dee2e6;
    transition: all 0.3s ease;
    cursor: pointer;
    display: inline-block;
    margin: 5px;
  }
  
  .topic-item:hover {
    background: linear-gradient(45deg, #FFD93D, #FF6B6B);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  }
  
  .topic-item.selected {
    background: linear-gradient(45deg, #FFD700, #FF6B6B) !important;
    color: #fff !important;
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
  }
`;

// Inject design system styles
if (!document.getElementById('lightning-talk-design-system-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'lightning-talk-design-system-styles';
  styleSheet.textContent = designSystemCSS;
  document.head.appendChild(styleSheet);
}