import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Header from './header';
import './home.css';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const navigate = useNavigate();
  const [showForms, setShowForms] = useState(false);
  const [showEmployeeLinks, setShowEmployeeLinks] = useState(false);
  const [showStudentLinks, setShowStudentLinks] = useState(false);
  const { t } = useLanguage();

  const handleFormsClick = () => {
    setShowForms(!showForms);
  };

  const handleEmployeeClick = () => {
    setShowEmployeeLinks(!showEmployeeLinks);
  };

  const handleStudentClick = () => {
    setShowStudentLinks(!showStudentLinks);
  };

  const handleCitizenClick = () => {
    window.open('/citizen-form', '_self');
  };

  const handleTraceDetailsClick = () => {
    window.open('/trace-details', '_self');
  };

  const handleUpdateDetailsClick = () => {
    window.open('/update-details', '_self');
  };

  return (
    <div className="home-page-container">
      <div className="top-header-wrapper">
        <Header />
      </div>

      <div className="carousel-container">
        <div className="carousel-track">
          {/* Beautiful Bus & Transport Imagery via Unsplash */}
          <div className="carousel-slide">
            <img src="/homebg.png" alt="Bus 1" />
            <div className="carousel-overlay">
              <h2>{t('safe_reliable_journey')}</h2>
              <p>{t('comfortable_ride_desc')}</p>
            </div>
          </div>
          <div className="carousel-slide">
            <img src="/home2.png" alt="Bus 2" />
            <div className="carousel-overlay">
              <h2>{t('express_bus_services')}</h2>
              <p>{t('connecting_cities_desc')}</p>
            </div>
          </div>
          <div className="carousel-slide">
            <img src="/home1.jpg" alt="Bus 3" />
            <div className="carousel-overlay">
              <h2>{t('easy_pass_booking')}</h2>
              <p>{t('digital_pass_desc')}</p>
            </div>
          </div>

        </div>
      </div>

      <div className="home-content">
        <h2 className="welcome-title">{t('welcome_title')}</h2>
        <p className="welcome-subtitle">{t('welcome_subtitle')}</p>

        <div className="action-cards">
          <div className="action-card" onClick={handleStudentClick}>
            <div className="icon"><img src="/Student.svg" alt="Student" /></div>
            <h3>{t('fresh_registration')}</h3>
            {showStudentLinks ? (
              <div className="download-links">
                <span onClick={(e) => { e.stopPropagation(); window.open('/above-ssc', '_self'); }}>{t('above_ssc')}</span>
                <span onClick={(e) => { e.stopPropagation(); window.open('/below-ssc', '_self'); }}>{t('below_ssc')}</span>
              </div>
            ) : (
              <p>{t('above_ssc')} & {t('below_ssc')}</p>
            )}
          </div>
          <div className="action-card" onClick={handleEmployeeClick}>
            <div className="icon"><img src="/emp.jpg" alt="Employee" /></div>
            <h3>{t('employee')}</h3>
            {showEmployeeLinks ? (
              <div className="download-links">
                <span onClick={(e) => { e.stopPropagation(); window.open('/gov-emp-form', '_self'); }}>{t('gov_employee')}</span>
                <span onClick={(e) => { e.stopPropagation(); window.open('/non-gov-emp-form', '_self'); }}>{t('non_gov_employee')}</span>
                <span onClick={(e) => { e.stopPropagation(); window.open('/ngo-form', '_self'); }}>{t('ngo_application')}</span>
                <span onClick={(e) => { e.stopPropagation(); window.open('/journalist-form', '_self'); }}>{t('journalist_form')}</span>
              </div>
            ) : (
              <p>{t('government_non_government')}</p>
            )}
          </div>
          <div className="action-card" onClick={handleCitizenClick}>
            <div className="icon"><img src="/citizen.jpg" alt="Citizens" /></div>
            <h3>{t('citizens')}</h3>
            <p>{t('general_citizens_passes')}</p>
          </div>
          <div className="action-card" onClick={handleUpdateDetailsClick}>
            <div className="icon"><img src="/Update.svg" alt="Update Details" /></div>
            <h3>{t('update_details')}</h3>
            <p>{t('modify_basic_info')}</p>
          </div>
          <div className="action-card" onClick={() => window.open('/payment', '_self')}>
            <div className="icon"><img src="/pay.svg" alt="Payment" /></div>
            <h3>{t('payment')}</h3>
            <p>{t('pre_present_payments')}</p>
          </div>
          <div className="action-card" onClick={handleTraceDetailsClick}>
            <div className="icon"><img src="/trace.webp" alt="Trace Details" /></div>
            <h3>{t('trace_details')}</h3>
            <p>{t('track_pass_status')}</p>
          </div>
          <div className="action-card" onClick={handleFormsClick}>
            <div className="icon"><img src="/dow.svg" alt="Download Forms" /></div>
            <h3>{t('download_forms')}</h3>
            {showForms ? (
              <div className="download-links">
                <a href="/belowSSCApplicationForm.pdf" download="Below_SSC_Form.pdf" onClick={(e) => e.stopPropagation()}>{t('below_ssc')}</a>
                <a href="/aboveSSCApplicationForm.pdf" download="Above_SSC_Form.pdf" onClick={(e) => e.stopPropagation()}>{t('above_ssc')}</a>
                <a href="/NGOApplicationForm.pdf" download="NGO_Application.pdf" onClick={(e) => e.stopPropagation()}>{t('ngo_application')}</a>
                <a href="/JournalistForm.pdf" download="Journalist_Form.pdf" onClick={(e) => e.stopPropagation()}>{t('journalist_form')}</a>
              </div>
            ) : (
              <p>{t('click_to_view_download')}</p>
            )}
          </div>
          <div className="action-card" onClick={() => window.open('/my-pass', '_self')}>
            <div className="icon"><img src="/pass.png" alt="My Pass" /></div>
            <h3>{t('my_pass')}</h3>
            <p>{t('view_active_passes')}</p>
          </div>
          <div className="action-card" onClick={() => window.open('/renewal', '_self')}>
            <div className="icon"><img src="/renew.webp" alt="Renewal Pass" /></div>
            <h3>{t('renewal_pass')}</h3>
            <p>{t('below_ssc')} & {t('above_ssc')}</p>
          </div>
          <div className="action-card" onClick={() => window.open('/Know_More.pdf', '_self')}>
            <div className="icon"><img src="/dow1.svg" alt="Know More" /></div>
            <h3>{t('know_more')}</h3>
            <p>{t('view_document')}</p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="home-footer">
        <div className="footer-content">
          <h4>{t('digital_bus_pass_system')}</h4>
          <p>&copy; {new Date().getFullYear()} {t('digital_bus_pass_system')}. {t('all_rights_reserved')}</p>
          <div className="footer-links">
            <a href="#about">{t('about_us')}</a>
            <a href="#contact">{t('contact')}</a>
            <a href="#privacy">{t('privacy_policy')}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
export default Home;
