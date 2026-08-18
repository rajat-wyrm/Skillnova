import SharedHeader from '../../shared/components/Header';

const Header = (props) => (
  <SharedHeader
    {...props}
    searchPlaceholder="Search users, reports…"
    avatarGradient="linear-gradient(135deg, #ff6d34, #00bea3)"
    notifColor="#ff6d34"
    showRelative={true}
  />
);

export default Header;
