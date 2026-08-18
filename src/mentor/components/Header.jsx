import SharedHeader from '../../shared/components/Header';

const Header = (props) => (
  <SharedHeader
    {...props}
    searchPlaceholder="Search interns, reports…"
    avatarGradient="linear-gradient(135deg, #7C3AED, #2563EB)"
    notifColor="#7C3AED"
    showRelative={false}
  />
);

export default Header;
