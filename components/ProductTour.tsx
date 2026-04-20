import React, { useEffect, useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';

interface ProductTourProps {
  role: 'COMPANY_OWNER' | 'PARTNER';
  userId: string;
}

const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}: any) => {
  return (
    <div 
      {...tooltipProps} 
      className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 md:p-8 font-sans animate-fade-in mx-2 max-w-[340px]"
    >
      <div className="flex items-center gap-3 mb-4">
        {step.icon && (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
            <i className={`fas ${step.icon}`}></i>
          </div>
        )}
        {step.title && (
          <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
            {step.title}
          </h3>
        )}
      </div>

      <div className="text-slate-500 text-[13px] font-medium leading-relaxed mb-8">
        {step.content}
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
           {!isLastStep && (
             <button 
               {...closeProps} 
               className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors px-2 py-2"
             >
               Passer
             </button>
           )}
        </div>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button 
              {...backProps} 
              className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Retour
            </button>
          )}
          <button 
            {...primaryProps} 
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            {continuous && !isLastStep ? 'Suivant' : 'Terminer'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductTour: React.FC<ProductTourProps> = ({ role, userId }) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the tour
    const tourKey = `perasafe_tour_completed_${userId}`;
    const hasSeenTour = localStorage.getItem(tourKey);

    if (!hasSeenTour) {
      // Small delay to ensure the DOM is fully rendered
      setTimeout(() => {
        setRun(true);
      }, 1000);
    }
  }, [userId]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`perasafe_tour_completed_${userId}`, 'true');
    }
  };

  const adminSteps: any[] = [
    {
      target: 'body',
      title: 'Bienvenue',
      icon: 'fa-hand-sparkles',
      content: 'Voici PeraSafe. Entrons dans le vif du sujet pour sécuriser vos documents stratégiques.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-admin-editor',
      title: 'Éditeur Sécurisé',
      icon: 'fa-shield-halved',
      content: 'Ici, vous pouvez rédiger votre contenu confidentiel. Il sera chiffré localement avant d\'être sauvegardé.',
      placement: 'bottom',
    },
    {
      target: '#tour-admin-settings',
      title: 'Paramètres',
      icon: 'fa-sliders',
      content: 'Configurez les accès : adresses emails des partenaires, durée d\'expiration autorisée, et le code secret unique.',
      placement: 'top',
    },
    {
      target: '#tour-admin-save',
      title: 'Chiffrement',
      icon: 'fa-lock',
      content: 'Une fois terminé, cliquez ici pour chiffrer et stocker le document au sein de votre coffre.',
      placement: 'bottom',
    },
    {
      target: '#tour-admin-inventory',
      title: 'Inventaire',
      icon: 'fa-vault',
      content: 'Retrouvez vos documents ici. Vous pouvez gérer leurs codes, les exporter en .peravault ou copier le lien sécurisé pour les partenaires.',
      placement: 'top',
    }
  ];

  const partnerSteps: any[] = [
    {
      target: 'body',
      title: 'Bienvenue',
      icon: 'fa-hand-sparkles',
      content: 'Bienvenue dans la zone partenaire PeraSafe. On vous a envoyé des fichiers ultra-sécurisés ? Lisez-les ici.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-user-import',
      title: 'Importation',
      icon: 'fa-file-import',
      content: 'Pour consulter un fichier .peravault reçu (ou via le presse-papiers), c\'est ici que ça se passe.',
      placement: 'bottom',
    },
    {
      target: '#tour-user-vault',
      title: 'Intelligence',
      icon: 'fa-eye',
      content: 'Vos documents déverrouillés et chiffrés apparaîtront ici. Entrez le code secret pour les visualiser. Attention à l\'auto-destruction !',
      placement: 'top',
    }
  ];

  const steps = role === 'COMPANY_OWNER' ? adminSteps : partnerSteps;

  const JoyrideComponent = Joyride as any;

  return (
    <JoyrideComponent
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(15, 23, 42, 0.75)',
        }
      }}
    />
  );
};

export default ProductTour;
